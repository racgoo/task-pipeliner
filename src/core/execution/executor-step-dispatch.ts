import { executeRunStep } from '@core/execution/handlers/run';
import { WorkflowRecorder } from '@core/history/recorder';
import { normalizeWorkflowStep } from '@core/parsing/malformed-step';
import { TaskRunner } from '@core/runtime/task-runner';
import { substituteVariables } from '@core/workflow/template';
import type { Workspace } from '@core/workflow/workspace';
import type { ChooseStep, PromptStep, Step, StepResult } from '@tp-types/workflow';
import type { WorkflowExecutionContext } from './executor-context';
import type { ResolvedRecordValues } from './executor-recording';
import { executeParallelStep as executeParallelStepHandler } from './handlers/parallel';
import type { TaskRunOutputPort } from './ports';

interface PromptChoice {
  prompt(
    message: string,
    options: Array<{ id: string; label: string }>
  ): Promise<{ id: string; label: string }>;
}

interface PromptText {
  prompt(message: string, defaultValue?: string): Promise<string>;
}

export interface ExecuteWorkflowStepDeps {
  workspace: Workspace;
  taskRunner: TaskRunner;
  taskRunOutputPort: TaskRunOutputPort;
  choicePrompt: PromptChoice;
  textPrompt: PromptText;
  baseDir?: string;
  globalShell?: string[];
  recorder?: WorkflowRecorder;
  calculateBaseStepIndex(context: WorkflowExecutionContext): number;
  getRecordResolved(step: Step): ResolvedRecordValues | undefined;
}

interface ExecuteWorkflowStepOptions {
  bufferOutput?: boolean;
  hasWhenCondition?: boolean;
}

export async function executeWorkflowStep(
  deps: ExecuteWorkflowStepDeps,
  step: Step,
  context: WorkflowExecutionContext,
  options: ExecuteWorkflowStepOptions = {}
): Promise<StepResult> {
  const normalizedStep = normalizeWorkflowStep(step) as Step;
  const bufferOutput = options.bufferOutput ?? false;
  const hasWhenCondition = options.hasWhenCondition ?? false;

  if ('run' in normalizedStep) {
    const result = await executeRunStep(
      {
        workspace: deps.workspace,
        taskRunner: deps.taskRunner,
        baseDir: deps.baseDir,
        globalShell: deps.globalShell,
        calculateBaseStepIndex: (executionContext) =>
          deps.calculateBaseStepIndex(executionContext as WorkflowExecutionContext),
      },
      normalizedStep,
      context,
      bufferOutput,
      hasWhenCondition
    );

    return bufferOutput && typeof result === 'object' && 'stdout' in result ? result : result;
  }

  if ('choose' in normalizedStep) {
    await executeChooseStep(deps, normalizedStep, context);
    return;
  }

  if ('prompt' in normalizedStep) {
    await executePromptStep(deps, normalizedStep, context);
    return;
  }

  if ('parallel' in normalizedStep) {
    await executeParallelStepHandler(
      {
        outputPort: deps.taskRunOutputPort,
        workspace: deps.workspace,
        taskRunner: deps.taskRunner,
        executeStep: (nestedStep, nestedContext, nextBufferOutput) =>
          executeWorkflowStep(deps, nestedStep, nestedContext as WorkflowExecutionContext, {
            bufferOutput: nextBufferOutput,
            hasWhenCondition: Boolean(nestedStep.when),
          }),
        setStepResult: (stepIndex, success) => deps.workspace.setStepResult(stepIndex, success),
        recordBranch: deps.recorder
          ? (branchStep, branchContext, branchOutput, branchStatus, resolved) => {
              deps.recorder?.recordStart();
              const resolvedValues = resolved ?? deps.getRecordResolved(branchStep);
              deps.recorder?.recordEnd(
                branchStep,
                branchContext as WorkflowExecutionContext,
                branchOutput,
                branchStatus,
                resolvedValues
              );
            }
          : undefined,
      },
      normalizedStep,
      context
    );
    return;
  }

  if ('fail' in normalizedStep) {
    await executeFailStep(normalizedStep);
    return;
  }
}

async function executeChooseStep(
  deps: ExecuteWorkflowStepDeps,
  step: ChooseStep,
  context: WorkflowExecutionContext
): Promise<void> {
  const variableName = step.choose.as;
  const optionIds = step.choose.options.map((option) => option.id);

  if (variableName && deps.workspace.hasVariable(variableName)) {
    const value = deps.workspace.getVariable(variableName) ?? '';
    if (optionIds.includes(value)) {
      deps.workspace.setChoice(value, value);
      deps.workspace.setStepResult(context.stepIndex, true);
      return;
    }
  }

  const choice = await deps.choicePrompt.prompt(step.choose.message, step.choose.options);
  if (!choice?.id) {
    throw new Error(`Invalid choice result: ${JSON.stringify(choice)}`);
  }

  const resolvedVariableName = variableName ?? choice.id;
  deps.workspace.setChoice(choice.id, choice.id);
  deps.workspace.setVariable(resolvedVariableName, choice.id);
  deps.workspace.setStepResult(context.stepIndex, true);
}

async function executePromptStep(
  deps: ExecuteWorkflowStepDeps,
  step: PromptStep,
  context: WorkflowExecutionContext
): Promise<void> {
  const variableName = step.prompt.as;

  if (deps.workspace.hasVariable(variableName)) {
    const value = deps.workspace.getVariable(variableName) ?? '';
    deps.workspace.setFact(variableName, value);
    deps.workspace.setStepResult(context.stepIndex, true);
    return;
  }

  const message = substituteVariables(step.prompt.message, deps.workspace);
  const defaultValue = step.prompt.default
    ? substituteVariables(step.prompt.default, deps.workspace)
    : undefined;
  const value = await deps.textPrompt.prompt(message, defaultValue);

  deps.workspace.setVariable(variableName, value);
  deps.workspace.setFact(variableName, value);
  deps.workspace.setStepResult(context.stepIndex, true);
}

async function executeFailStep(step: { fail: { message: string } }): Promise<void> {
  const error = new Error(step.fail.message);
  error.stack = undefined;
  throw error;
}
