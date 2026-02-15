import type { TaskRunOutputPort } from '@core/execution/ports';
import { ConditionEvaluator } from '@core/workflow/condition-evaluator';
import type { Workspace } from '@core/workflow/workspace';
import type { ExecutionContext, TaskRunResult } from '@tp-types/execution';
import type { Step, StepResult } from '@tp-types/workflow';
import logUpdate from 'log-update';

export const PARALLEL_STEP_INDEX_MULTIPLIER = 1000;

export interface IParallelStepHandlerDeps {
  outputPort: TaskRunOutputPort;
  workspace: Workspace;
  taskRunner: {
    displayBufferedOutput(
      result: TaskRunResult,
      stepName: string,
      isNested: boolean,
      lineNumber?: number,
      fileName?: string
    ): void;
  };
  executeStep(step: Step, context: ExecutionContext, bufferOutput: boolean): Promise<StepResult>;
  setStepResult(stepIndex: number, success: boolean): void;
  recordBranch?(
    step: Step,
    context: ExecutionContext,
    output: StepResult,
    status: 'success' | 'failure',
    resolved?: { resolvedCommand?: string }
  ): void;
}

type BranchContext = ExecutionContext<Workspace>;

function createParallelContexts(
  deps: IParallelStepHandlerDeps,
  step: { parallel: Step[] },
  baseContext: BranchContext
): BranchContext[] {
  return step.parallel.map((_, branchIndex) => ({
    workspace: deps.workspace.clone(),
    stepIndex: baseContext.stepIndex * PARALLEL_STEP_INDEX_MULTIPLIER + branchIndex,
    branchIndex: branchIndex,
    lineNumber: baseContext.lineNumber,
    fileName: baseContext.fileName,
  }));
}

function getBranchDisplayName(step: Step, index: number): string {
  if ('run' in step) {
    return step.run;
  }
  if ('choose' in step) {
    return `Choose: ${step.choose.message}`;
  }
  if ('prompt' in step) {
    return `Prompt: ${step.prompt.message}`;
  }
  if ('fail' in step) {
    return `Fail: ${step.fail.message}`;
  }
  return `Branch ${index + 1}`;
}

function countExecutableBranches(steps: Step[], contexts: BranchContext[]): number {
  let count = 0;
  for (let i = 0; i < steps.length; i++) {
    const parallelStep = steps[i];
    const branchContext = contexts[i];

    if (parallelStep.when) {
      const evaluator = new ConditionEvaluator(branchContext.workspace);
      const conditionResult = evaluator.evaluate(parallelStep.when);
      if (!conditionResult) {
        continue;
      }
    }
    count++;
  }
  return count;
}

interface BranchStatus {
  index: number;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  error?: string;
}

function updateParallelBranchesDisplay(
  branchStatuses: BranchStatus[],
  spinner: string,
  _final: boolean = false
): void {
  const lines = branchStatuses.map((branch) => {
    const branchNum = branch.index + 1;
    let icon = '';
    let text = '';

    switch (branch.status) {
      case 'pending':
        icon = '○';
        text = `Branch ${branchNum}: ${branch.name} - Pending`;
        break;
      case 'running':
        icon = spinner;
        text = `Branch ${branchNum}: ${branch.name} - Running...`;
        break;
      case 'success':
        icon = '✓';
        text = `Branch ${branchNum}: ${branch.name} - Completed`;
        break;
      case 'failed':
        icon = '✗';
        text = `Branch ${branchNum}: ${branch.name} - Failed${branch.error ? `: ${branch.error}` : ''}`;
        break;
    }

    return `${icon} ${text}`;
  });

  logUpdate(lines.join('\n'));
}

async function executeParallelBranches(
  deps: IParallelStepHandlerDeps,
  getBranchDisplayNameFn: (step: Step, index: number) => string,
  steps: Step[],
  contexts: BranchContext[]
): Promise<
  Array<{
    index: number;
    result?: TaskRunResult;
    error?: unknown;
    context: BranchContext;
  } | null>
> {
  const branchStatuses: BranchStatus[] = [];
  const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let spinnerFrameIndex = 0;

  for (let i = 0; i < steps.length; i++) {
    const parallelStep = steps[i];
    const branchContext = contexts[i];

    if (parallelStep.when) {
      const evaluator = new ConditionEvaluator(branchContext.workspace);
      const conditionResult = evaluator.evaluate(parallelStep.when);
      if (!conditionResult) {
        continue;
      }
    }

    const branchName = getBranchDisplayNameFn(parallelStep, i);
    branchStatuses.push({
      index: i,
      name: branchName,
      status: 'pending',
    });
  }

  const spinnerInterval = setInterval(() => {
    spinnerFrameIndex = (spinnerFrameIndex + 1) % spinnerFrames.length;
    updateParallelBranchesDisplay(branchStatuses, spinnerFrames[spinnerFrameIndex]);
  }, 100);

  const promises = branchStatuses.map(async (branchStatus) => {
    const { index } = branchStatus;
    const parallelStep = steps[index];
    const branchContext = contexts[index];

    branchStatus.status = 'running';

    try {
      const result = await deps.executeStep(parallelStep, branchContext, true);

      branchStatus.status = 'success';
      updateParallelBranchesDisplay(branchStatuses, spinnerFrames[spinnerFrameIndex]);

      // Record the branch execution if recordBranch is provided
      if (deps.recordBranch) {
        const resolved = 'run' in parallelStep ? { resolvedCommand: parallelStep.run } : undefined;
        deps.recordBranch(parallelStep, branchContext, result, 'success', resolved);
      }

      return { index, result: result as TaskRunResult, context: branchContext };
    } catch (error) {
      branchContext.workspace.setStepResult(branchContext.stepIndex, false);

      const errorMessage = error instanceof Error ? error.message : String(error);
      branchStatus.status = 'failed';
      branchStatus.error = errorMessage;
      updateParallelBranchesDisplay(branchStatuses, spinnerFrames[spinnerFrameIndex]);

      // Record the branch execution failure if recordBranch is provided
      if (deps.recordBranch) {
        const resolved = 'run' in parallelStep ? { resolvedCommand: parallelStep.run } : undefined;
        deps.recordBranch(parallelStep, branchContext, undefined, 'failure', resolved);
      }

      return { index, error, context: branchContext };
    }
  });

  const results = await Promise.all(promises);

  clearInterval(spinnerInterval);
  updateParallelBranchesDisplay(branchStatuses, '', true);
  logUpdate.done();

  return results;
}

function displayParallelResults(
  deps: IParallelStepHandlerDeps,
  getBranchDisplayNameFn: (step: Step, index: number) => string,
  results: Array<{
    index: number;
    result?: TaskRunResult;
    error?: unknown;
    context: BranchContext;
  } | null>,
  steps: Step[],
  _context: BranchContext
): boolean {
  let allBranchesSucceeded = true;
  let hasAnyResult = false;

  console.log('');

  for (const result of results) {
    if (!result) continue;

    hasAnyResult = true;
    const { index, result: stepResult, error, context: branchContext } = result;

    if (error) {
      allBranchesSucceeded = false;
      const errorMessage = `Branch ${index + 1} failed: ${error instanceof Error ? error.message : String(error)}`;
      const errorBox = deps.outputPort.createErrorBox(errorMessage);
      console.error(errorBox);
    } else if (stepResult && typeof stepResult === 'object' && 'stdout' in stepResult) {
      const taskResult = stepResult;
      allBranchesSucceeded = allBranchesSucceeded && taskResult.success;

      if (taskResult.stdout.length > 0 || taskResult.stderr.length > 0 || !taskResult.success) {
        const parallelStep = steps[index];
        const stepName = getBranchDisplayNameFn(parallelStep, index);
        deps.taskRunner.displayBufferedOutput(
          taskResult,
          stepName,
          false,
          branchContext.lineNumber,
          branchContext.fileName
        );
      }
    }
  }

  if (!hasAnyResult) {
    console.log('⚠️  All parallel branches were skipped (conditions not met)');
  }

  const parallelFooterMessage = deps.outputPort.createParallelFooterMessage(allBranchesSucceeded);
  console.log(parallelFooterMessage);

  return allBranchesSucceeded;
}

function mergeParallelResults(deps: IParallelStepHandlerDeps, contexts: BranchContext[]): void {
  for (const branchContext of contexts) {
    const facts = branchContext.workspace.getAllFacts();
    const variables = branchContext.workspace.getAllVariables();

    for (const [key, value] of facts) {
      deps.workspace.setFact(key, value);
    }
    for (const [key, value] of variables) {
      deps.workspace.setVariable(key, value);
    }
  }
}

/**
 * Execute a parallel step (run multiple steps simultaneously).
 * Same semantics and throw/success behavior as Executor's executeParallelStep.
 */
export async function executeParallelStep(
  deps: IParallelStepHandlerDeps,
  step: { parallel: Step[] },
  context: BranchContext
): Promise<void> {
  const parallelContexts = createParallelContexts(deps, step, context);
  const executableBranchCount = countExecutableBranches(step.parallel, parallelContexts);

  const parallelHeaderBox = deps.outputPort.createParallelHeaderBox(executableBranchCount);
  console.log(parallelHeaderBox);

  const results = await executeParallelBranches(
    deps,
    getBranchDisplayName,
    step.parallel,
    parallelContexts
  );

  const allBranchesSucceeded = displayParallelResults(
    deps,
    getBranchDisplayName,
    results,
    step.parallel,
    context
  );

  deps.setStepResult(context.stepIndex, allBranchesSucceeded);

  if (!allBranchesSucceeded) {
    const lineInfo = context.lineNumber ? ` (line ${context.lineNumber})` : '';
    throw new Error(
      `Parallel step ${context.stepIndex}${lineInfo} failed: one or more branches failed`
    );
  }

  mergeParallelResults(deps, parallelContexts);
}
