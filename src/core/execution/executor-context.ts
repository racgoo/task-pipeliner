import { dirname, isAbsolute, resolve } from 'path';
import type { Workspace } from '@core/workflow/workspace';
import type { ExecutionContext } from '@tp-types/execution';
import type { Workflow } from '@tp-types/workflow';
import { PARALLEL_STEP_INDEX_MULTIPLIER } from './constants';

export type WorkflowExecutionContext = ExecutionContext<Workspace>;

export function resolveWorkflowBaseDir(workflow: Workflow): string | undefined {
  if (!workflow.baseDir) {
    if (workflow._filePath) {
      return dirname(workflow._filePath);
    }
    return undefined;
  }

  if (isAbsolute(workflow.baseDir)) {
    return workflow.baseDir;
  }

  if (workflow._filePath) {
    const workflowDirectory = dirname(workflow._filePath);
    return resolve(workflowDirectory, workflow.baseDir);
  }

  return resolve(process.cwd(), workflow.baseDir);
}

export function createWorkflowStepContext(
  stepIndex: number,
  workflow: Workflow,
  workspace: Workspace
): WorkflowExecutionContext {
  const context: WorkflowExecutionContext = {
    workspace,
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

export function calculateBaseStepIndex(context: WorkflowExecutionContext): number {
  if (context.branchIndex === undefined) {
    return context.stepIndex;
  }

  return Math.floor(context.stepIndex / PARALLEL_STEP_INDEX_MULTIPLIER);
}
