import type { Workspace } from '@core/workflow/workspace';
import type { TaskRunResult } from '@tp-types/execution';
import type { RunStep, Step, StepResult } from '@tp-types/workflow';
import type { WorkflowExecutionContext } from './executor-context';

export function isRunStep(step: Step): step is RunStep {
  return 'run' in step;
}

export function isStepSuccessful(stepResult: TaskRunResult | boolean | void, step: Step): boolean {
  if (!isRunStep(step)) {
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

export function resolveStepSuccess(
  step: Step,
  stepIndex: number,
  stepResult: StepResult,
  workspace: Workspace
): boolean {
  if (!isRunStep(step)) {
    return isStepSuccessful(stepResult, step);
  }

  const storedResult = workspace.getStepResult(stepIndex);
  return storedResult ? storedResult.success : true;
}

export function enforceRunStepPolicy(
  step: Step,
  context: WorkflowExecutionContext,
  stepIndex: number,
  isSuccessful: boolean
): void {
  if (!isRunStep(step)) {
    return;
  }

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
