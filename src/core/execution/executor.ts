import { dirname, isAbsolute, resolve } from 'path';
import { WorkflowRecorder } from '@core/history/recorder';
import { TaskRunner } from '@core/runtime/task-runner';
import { ConditionEvaluator } from '@core/workflow/condition-evaluator';
import { substituteVariables } from '@core/workflow/template';
import { Workspace } from '@core/workflow/workspace';
import type { Condition } from '@tp-types/condition';
import type { ExecutionContext, TaskRunResult } from '@tp-types/execution';
import type {
  ChooseStep,
  PromptStep,
  RunStep,
  Step,
  StepResult,
  Workflow,
} from '@tp-types/workflow';
import {
  PARALLEL_STEP_INDEX_MULTIPLIER,
  executeParallelStep as executeParallelStepHandler,
} from './handlers/parallel';
import { executeRunStep } from './handlers/run';
import type {
  ExecutionOutputPort,
  PromptPort,
  TaskRunOutputPort,
  ExecutorRunOptions,
} from './ports';

/**
 * Options for workflow execution (e.g. profile variables for non-interactive runs)
 */
export interface ExecuteOptions extends ExecutorRunOptions {
  executionVars?: Record<string, string>;
}

type WorkflowExecutionContext = ExecutionContext<Workspace>;

export interface ExecutorDeps {
  promptPort: PromptPort;
  executionOutputPort: ExecutionOutputPort;
  taskRunOutputPort: TaskRunOutputPort;
  workspace?: Workspace;
  taskRunner?: TaskRunner;
}

export class Executor {
  private workspace: Workspace;
  private taskRunner: TaskRunner;
  private taskRunOutputPort: TaskRunOutputPort;
  private executionOutputPort: ExecutionOutputPort;
  private baseDir?: string;
  private globalShell?: string[];
  /**
   * Compatibility surface for existing tests.
   * Internal execution routes through these objects so tests can spy/override prompt behavior.
   */
  public choicePrompt: {
    prompt: (
      message: string,
      options: Array<{ id: string; label: string }>
    ) => Promise<{
      id: string;
      label: string;
    }>;
  };
  public textPrompt: {
    prompt: (message: string, defaultValue?: string) => Promise<string>;
  };

  constructor(deps: ExecutorDeps) {
    this.workspace = deps.workspace ?? new Workspace();
    this.taskRunner = deps.taskRunner ?? new TaskRunner({ outputPort: deps.taskRunOutputPort });
    this.taskRunOutputPort = deps.taskRunOutputPort;
    this.executionOutputPort = deps.executionOutputPort;
    this.choicePrompt = {
      prompt: (message, options) => deps.promptPort.choose(message, options),
    };
    this.textPrompt = {
      prompt: (message, defaultValue) => deps.promptPort.text(message, defaultValue),
    };
  }

  private resolveBaseDir(workflow: Workflow): void {
    if (!workflow.baseDir) {
      if (workflow._filePath) {
        this.baseDir = dirname(workflow._filePath);
      }
      return;
    }

    if (isAbsolute(workflow.baseDir)) {
      this.baseDir = workflow.baseDir;
    } else if (workflow._filePath) {
      const yamlDir = dirname(workflow._filePath);
      this.baseDir = resolve(yamlDir, workflow.baseDir);
    } else {
      this.baseDir = resolve(process.cwd(), workflow.baseDir);
    }
  }

  private createStepContext(stepIndex: number, workflow: Workflow): WorkflowExecutionContext {
    const context: WorkflowExecutionContext = {
      workspace: this.workspace,
      stepIndex,
    };

    if (workflow._lineNumbers) {
      context.lineNumber = workflow._lineNumbers.get(stepIndex);
    }
    if (workflow._fileName) {
      context.fileName = workflow._fileName;
    }

    return context;
  }

  private evaluateStepCondition(step: Step): boolean {
    if (!step.when) {
      return true;
    }

    const evaluator = new ConditionEvaluator(this.workspace);
    return evaluator.evaluate(step.when);
  }

  private calculateBaseStepIndex(context: WorkflowExecutionContext): number {
    if (context.branchIndex === undefined) {
      return context.stepIndex;
    }
    return Math.floor(context.stepIndex / PARALLEL_STEP_INDEX_MULTIPLIER);
  }

  private isRunStep(step: Step): step is RunStep {
    return 'run' in step;
  }

  private getRecordResolved(step: Step):
    | {
        resolvedCommand?: string;
        choiceValue?: string;
        promptValue?: string | boolean;
      }
    | undefined {
    if ('run' in step) {
      return { resolvedCommand: substituteVariables(step.run.trim(), this.workspace) };
    }
    if ('choose' in step) {
      const choiceValue =
        step.choose.as && this.workspace.hasVariable(step.choose.as)
          ? this.workspace.getVariable(step.choose.as)
          : step.choose.options.find((o) => this.workspace.getChoice(o.id))?.id;
      return choiceValue !== undefined ? { choiceValue } : undefined;
    }
    if ('prompt' in step) {
      const promptValue = this.workspace.getFact(step.prompt.as);
      return promptValue !== undefined ? { promptValue } : undefined;
    }
    return undefined;
  }

  async execute(workflow: Workflow, options?: ExecuteOptions): Promise<void> {
    if (options?.executionVars && Object.keys(options.executionVars).length > 0) {
      for (const [key, value] of Object.entries(options.executionVars)) {
        this.workspace.setVariable(key, value);
      }
    }

    this.resolveBaseDir(workflow);
    this.globalShell = workflow.shell;

    const recorder = new WorkflowRecorder();
    const workflowStartTime = Date.now();

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const context = this.createStepContext(i, workflow);
      const hasWhenCondition = !!step.when;

      if (!this.evaluateStepCondition(step)) {
        continue;
      }

      recorder.recordStart();

      try {
        const stepResult = await this.executeStep(step, context, false, hasWhenCondition, recorder);
        if (!('parallel' in step)) {
          this.handleStepResult(step, context, i, stepResult, recorder);
        }
      } catch (error) {
        if (!('parallel' in step)) {
          this.handleStepError(step, context, i, error, recorder);
        }
        throw error;
      }
    }

    const totalDuration = Date.now() - workflowStartTime;
    this.executionOutputPort.showTotalExecutionTime(totalDuration);

    const history = recorder.getHistory();
    this.executionOutputPort.showTimeline(history);

    await recorder.save();
    recorder.reset();
  }

  private isStepSuccessful(stepResult: TaskRunResult | boolean | void, step: Step): boolean {
    if (!('run' in step)) {
      return true;
    }
    if (typeof stepResult === 'boolean') {
      return stepResult;
    }
    if (stepResult && typeof stepResult === 'object' && 'success' in stepResult) {
      return stepResult.success;
    }
    return false;
  }

  private handleStepResult(
    step: Step,
    context: WorkflowExecutionContext,
    stepIndex: number,
    stepResult: StepResult,
    recorder: WorkflowRecorder
  ): void {
    const isSuccessful = this.isRunStep(step)
      ? (() => {
          const stored = this.workspace.getStepResult(stepIndex);
          return stored ? stored.success : true;
        })()
      : this.isStepSuccessful(stepResult, step);

    const status: 'success' | 'failure' = isSuccessful ? 'success' : 'failure';
    const resolved = this.getRecordResolved(step);
    const duration = recorder.recordEnd(step, context, stepResult, status, resolved);

    if (!this.isRunStep(step)) {
      this.executionOutputPort.showStepFooter(isSuccessful, duration);
    }

    if (this.isRunStep(step)) {
      if (step.continue === false) {
        const lineInfo = context.lineNumber ? ` (line ${context.lineNumber})` : '';
        const message = isSuccessful
          ? `Step ${stepIndex}${lineInfo} completed, but workflow stopped due to continue: false`
          : `Step ${stepIndex}${lineInfo} failed`;
        throw new Error(message);
      }
      if (!isSuccessful && step.continue !== true) {
        const lineInfo = context.lineNumber ? ` (line ${context.lineNumber})` : '';
        throw new Error(`Step ${stepIndex}${lineInfo} failed`);
      }
    }
  }

  private handleStepError(
    step: Step,
    context: WorkflowExecutionContext,
    stepIndex: number,
    error: unknown,
    recorder: WorkflowRecorder
  ): void {
    this.workspace.setStepResult(stepIndex, false);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorResult: TaskRunResult = {
      success: false,
      stdout: [],
      stderr: [errorMessage],
    };
    const resolved = this.getRecordResolved(step);
    recorder.recordEnd(step, context, errorResult, 'failure', resolved);
  }

  private fixMalformedStep(step: Step): Step {
    const stepAsRecord = step as unknown as Record<string, unknown>;
    const hasMalformedChoose =
      'choose' in step && stepAsRecord.choose === null && 'message' in step && 'options' in step;

    if (hasMalformedChoose) {
      return {
        choose: {
          message: stepAsRecord.message as string,
          options: stepAsRecord.options as Array<{ id: string; label: string }>,
          as: stepAsRecord.as as string | undefined,
        },
        when: stepAsRecord.when as Condition | undefined,
      } as ChooseStep;
    }

    const hasMalformedPrompt =
      'prompt' in step && stepAsRecord.prompt === null && 'message' in step && 'as' in step;

    if (hasMalformedPrompt) {
      return {
        prompt: {
          message: stepAsRecord.message as string,
          as: stepAsRecord.as as string,
          default: stepAsRecord.default as string | undefined,
        },
        when: stepAsRecord.when as Condition | undefined,
      } as PromptStep;
    }

    return step;
  }

  private async executeStep(
    step: Step,
    context: WorkflowExecutionContext,
    bufferOutput: boolean = false,
    hasWhenCondition: boolean = false,
    recorder?: WorkflowRecorder
  ): Promise<StepResult> {
    step = this.fixMalformedStep(step);

    if ('run' in step) {
      const result = await executeRunStep(
        {
          workspace: this.workspace,
          taskRunner: this.taskRunner,
          baseDir: this.baseDir,
          globalShell: this.globalShell,
          calculateBaseStepIndex: (ctx) =>
            this.calculateBaseStepIndex(ctx as WorkflowExecutionContext),
        },
        step,
        context,
        bufferOutput,
        hasWhenCondition
      );
      return bufferOutput && typeof result === 'object' && 'stdout' in result ? result : result;
    }

    if ('choose' in step) {
      await this.executeChooseStep(step, context);
      return;
    }

    if ('prompt' in step) {
      await this.executePromptStep(step, context);
      return;
    }

    if ('parallel' in step) {
      await executeParallelStepHandler(
        {
          outputPort: this.taskRunOutputPort,
          workspace: this.workspace,
          taskRunner: this.taskRunner,
          executeStep: (s, ctx, nextBufferOutput) =>
            this.executeStep(
              s,
              ctx as WorkflowExecutionContext,
              nextBufferOutput,
              !!s.when,
              recorder
            ),
          setStepResult: (stepIndex, success) => this.workspace.setStepResult(stepIndex, success),
          recordBranch: recorder
            ? (branchStep, branchContext, branchOutput, branchStatus, resolved) => {
                recorder.recordStart();
                const resolvedValues = resolved ?? this.getRecordResolved(branchStep);
                recorder.recordEnd(
                  branchStep,
                  branchContext as WorkflowExecutionContext,
                  branchOutput,
                  branchStatus,
                  resolvedValues
                );
              }
            : undefined,
        },
        step,
        context
      );
      return;
    }

    if ('fail' in step) {
      await this.executeFailStep(step);
      return;
    }
  }

  private async executeChooseStep(
    step: {
      choose: { message: string; options: Array<{ id: string; label: string }>; as?: string };
    },
    context: WorkflowExecutionContext
  ): Promise<void> {
    const variableName = step.choose.as;
    const optionIds = step.choose.options.map((o) => o.id);

    if (variableName && this.workspace.hasVariable(variableName)) {
      const value = this.workspace.getVariable(variableName) ?? '';
      if (optionIds.includes(value)) {
        this.workspace.setChoice(value, value);
        this.workspace.setStepResult(context.stepIndex, true);
        return;
      }
    }

    const choice = await this.choicePrompt.prompt(step.choose.message, step.choose.options);

    if (!choice?.id) {
      throw new Error(`Invalid choice result: ${JSON.stringify(choice)}`);
    }

    const resolvedVariableName = variableName ?? choice.id;
    this.workspace.setChoice(choice.id, choice.id);
    this.workspace.setVariable(resolvedVariableName, choice.id);
    this.workspace.setStepResult(context.stepIndex, true);
  }

  private async executePromptStep(
    step: { prompt: { message: string; as: string; default?: string } },
    context: WorkflowExecutionContext
  ): Promise<void> {
    const varName = step.prompt.as;

    if (this.workspace.hasVariable(varName)) {
      const value = this.workspace.getVariable(varName) ?? '';
      this.workspace.setFact(varName, value);
      this.workspace.setStepResult(context.stepIndex, true);
      return;
    }

    const message = substituteVariables(step.prompt.message, this.workspace);
    const defaultValue = step.prompt.default
      ? substituteVariables(step.prompt.default, this.workspace)
      : undefined;

    const value = await this.textPrompt.prompt(message, defaultValue);

    this.workspace.setVariable(varName, value);
    this.workspace.setFact(varName, value);
    this.workspace.setStepResult(context.stepIndex, true);
  }

  private async executeFailStep(step: { fail: { message: string } }): Promise<void> {
    const error = new Error(step.fail.message);
    error.stack = undefined;
    throw error;
  }
}
