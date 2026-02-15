import { WorkflowRecorder } from '@core/history/recorder';
import { TaskRunner } from '@core/runtime/task-runner';
import { ConditionEvaluator } from '@core/workflow/condition-evaluator';
import { substituteVariables } from '@core/workflow/template';
import { Workspace } from '@core/workflow/workspace';
import type { Step, Workflow, StepResult } from '@tp-types/workflow';
import {
  calculateBaseStepIndex,
  createWorkflowStepContext,
  resolveWorkflowBaseDir,
  type WorkflowExecutionContext,
} from './executor-context';
import { createStepErrorResult, getRecordResolved } from './executor-recording';
import { executeWorkflowStep } from './executor-step-dispatch';
import { enforceRunStepPolicy, isRunStep, resolveStepSuccess } from './executor-step-policy';
import type {
  ExecutionOutputPort,
  ExecutorRunOptions,
  PromptPort,
  TaskRunOutputPort,
} from './ports';

/**
 * Options for workflow execution (e.g. profile variables for non-interactive runs)
 */
export interface ExecuteOptions extends ExecutorRunOptions {
  executionVars?: Record<string, string>;
}

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

  private evaluateStepCondition(step: Step): boolean {
    if (!step.when) {
      return true;
    }

    const evaluator = new ConditionEvaluator(this.workspace);
    return evaluator.evaluate(step.when);
  }

  // Compatibility method for legacy tests.
  // Keep public surface even though internal flow now uses shared helper modules.
  public calculateBaseStepIndex(context: WorkflowExecutionContext): number {
    return calculateBaseStepIndex(context);
  }

  // Compatibility methods kept for legacy tests that call internal executor APIs directly.
  public async executeChooseStep(
    step: {
      choose: { message: string; options: Array<{ id: string; label: string }>; as?: string };
    },
    context: WorkflowExecutionContext
  ): Promise<void> {
    const variableName = step.choose.as;
    const optionIds = step.choose.options.map((option) => option.id);

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

  public async executePromptStep(
    step: { prompt: { message: string; as: string; default?: string } },
    context: WorkflowExecutionContext
  ): Promise<void> {
    const variableName = step.prompt.as;

    if (this.workspace.hasVariable(variableName)) {
      const value = this.workspace.getVariable(variableName) ?? '';
      this.workspace.setFact(variableName, value);
      this.workspace.setStepResult(context.stepIndex, true);
      return;
    }

    const message = substituteVariables(step.prompt.message, this.workspace);
    const defaultValue = step.prompt.default
      ? substituteVariables(step.prompt.default, this.workspace)
      : undefined;

    const value = await this.textPrompt.prompt(message, defaultValue);
    this.workspace.setVariable(variableName, value);
    this.workspace.setFact(variableName, value);
    this.workspace.setStepResult(context.stepIndex, true);
  }

  public async executeFailStep(step: { fail: { message: string } }): Promise<void> {
    const error = new Error(step.fail.message);
    error.stack = undefined;
    throw error;
  }

  private applyExecutionVariables(options?: ExecuteOptions): void {
    if (!options?.executionVars || Object.keys(options.executionVars).length === 0) {
      return;
    }

    for (const [key, value] of Object.entries(options.executionVars)) {
      this.workspace.setVariable(key, value);
    }
  }

  private handleStepResult(
    step: Step,
    context: WorkflowExecutionContext,
    stepIndex: number,
    stepResult: StepResult,
    recorder: WorkflowRecorder
  ): void {
    const isSuccessful = resolveStepSuccess(step, stepIndex, stepResult, this.workspace);
    const status: 'success' | 'failure' = isSuccessful ? 'success' : 'failure';
    const resolved = getRecordResolved(step, this.workspace);
    const duration = recorder.recordEnd(step, context, stepResult, status, resolved);

    if (!isRunStep(step)) {
      this.executionOutputPort.showStepFooter(isSuccessful, duration);
      return;
    }

    enforceRunStepPolicy(step, context, stepIndex, isSuccessful);
  }

  private handleStepError(
    step: Step,
    context: WorkflowExecutionContext,
    stepIndex: number,
    error: unknown,
    recorder: WorkflowRecorder
  ): void {
    this.workspace.setStepResult(stepIndex, false);
    const errorResult = createStepErrorResult(error);
    const resolved = getRecordResolved(step, this.workspace);
    recorder.recordEnd(step, context, errorResult, 'failure', resolved);
  }

  async execute(workflow: Workflow, options?: ExecuteOptions): Promise<void> {
    this.applyExecutionVariables(options);

    this.baseDir = resolveWorkflowBaseDir(workflow);
    this.globalShell = workflow.shell;

    const recorder = new WorkflowRecorder();
    const workflowStartTime = Date.now();

    for (let index = 0; index < workflow.steps.length; index++) {
      const step = workflow.steps[index];
      const context = createWorkflowStepContext(index, workflow, this.workspace);
      const hasWhenCondition = Boolean(step.when);

      if (!this.evaluateStepCondition(step)) {
        continue;
      }

      recorder.recordStart();

      try {
        const stepResult = await executeWorkflowStep(
          {
            workspace: this.workspace,
            taskRunner: this.taskRunner,
            taskRunOutputPort: this.taskRunOutputPort,
            choicePrompt: this.choicePrompt,
            textPrompt: this.textPrompt,
            baseDir: this.baseDir,
            globalShell: this.globalShell,
            recorder,
            calculateBaseStepIndex: (context) => this.calculateBaseStepIndex(context),
            getRecordResolved: (recordStep) => getRecordResolved(recordStep, this.workspace),
          },
          step,
          context,
          {
            bufferOutput: false,
            hasWhenCondition,
          }
        );

        if (!('parallel' in step)) {
          this.handleStepResult(step, context, index, stepResult, recorder);
        }
      } catch (error) {
        if (!('parallel' in step)) {
          this.handleStepError(step, context, index, error, recorder);
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
}
