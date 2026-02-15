import { substituteVariables } from '@core/workflow/template';
import type { Workspace } from '@core/workflow/workspace';
import type { TaskRunResult } from '@tp-types/execution';
import type { Step } from '@tp-types/workflow';

export interface ResolvedRecordValues {
  resolvedCommand?: string;
  choiceValue?: string;
  promptValue?: string | boolean;
}

export function getRecordResolved(
  step: Step,
  workspace: Workspace
): ResolvedRecordValues | undefined {
  if ('run' in step) {
    return { resolvedCommand: substituteVariables(step.run.trim(), workspace) };
  }

  if ('choose' in step) {
    const choiceValue =
      step.choose.as && workspace.hasVariable(step.choose.as)
        ? workspace.getVariable(step.choose.as)
        : step.choose.options.find((option) => workspace.getChoice(option.id))?.id;
    return choiceValue !== undefined ? { choiceValue } : undefined;
  }

  if ('prompt' in step) {
    const promptValue = workspace.getFact(step.prompt.as);
    return promptValue !== undefined ? { promptValue } : undefined;
  }

  return undefined;
}

export function createStepErrorResult(error: unknown): TaskRunResult {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return {
    success: false,
    stdout: [],
    stderr: [errorMessage],
  };
}
