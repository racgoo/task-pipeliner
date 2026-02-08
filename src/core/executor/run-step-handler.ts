import type { RunStep, RunStepOnError } from '../../types/workflow';
import { parseCapture } from '../capture-parser';
import type { ExecutionContext } from '../executor';
import { TaskRunner, type TaskRunResult } from '../task-runner';
import { substituteVariables } from '../template';
import type { Workspace } from '../workspace';

type RunChainNode = Pick<RunStepOnError, 'run' | 'timeout' | 'retry' | 'onError'>;

export interface IRunStepHandlerDeps {
  workspace: Workspace;
  taskRunner: TaskRunner;
  baseDir?: string;
  globalShell?: string[];
  calculateBaseStepIndex: (ctx: ExecutionContext) => number;
}

/**
 * Execute a single run command (no onError chain).
 * Used by executeRunStep and executeRunChain.
 */
async function executeSingleRun(
  deps: IRunStepHandlerDeps,
  step: Pick<RunStep, 'run' | 'timeout' | 'retry' | 'shell'>,
  context: ExecutionContext,
  bufferOutput: boolean,
  hasWhenCondition: boolean
): Promise<boolean | TaskRunResult> {
  const { workspace, taskRunner, baseDir, globalShell, calculateBaseStepIndex } = deps;
  const baseStepIndex = calculateBaseStepIndex(context);

  const command = substituteVariables(step.run.trim(), workspace);
  const shellConfig = step.shell ?? globalShell;
  const retryValue = step.retry ?? 0;
  const isInfiniteRetry = retryValue === 'Infinity' || retryValue === Infinity;
  const retryCount = typeof retryValue === 'number' ? retryValue : 0;
  const timeoutSeconds = step.timeout;

  let lastResult: boolean | TaskRunResult = false;
  let attempt = 0;

  const displayName =
    step.run.trim() !== command ? `${command}\n  (template: ${step.run})` : command;

  while (isInfiniteRetry || attempt <= retryCount) {
    const result = await taskRunner.run(
      command,
      baseStepIndex,
      displayName,
      context.branchIndex,
      bufferOutput,
      hasWhenCondition,
      context.lineNumber,
      context.fileName,
      baseDir,
      timeoutSeconds,
      shellConfig
    );

    const success = typeof result === 'boolean' ? result : result.success;
    lastResult = result;

    if (success) break;
    if (!isInfiniteRetry && attempt >= retryCount) break;

    attempt++;
    if (isInfiniteRetry || attempt <= retryCount) {
      const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return lastResult;
}

/**
 * Execute a run-like node and its nested onError chain
 */
async function executeRunChain(
  deps: IRunStepHandlerDeps,
  node: RunChainNode,
  context: ExecutionContext,
  bufferOutput: boolean,
  hasWhenCondition: boolean
): Promise<boolean | TaskRunResult> {
  const result = await executeSingleRun(
    deps,
    {
      run: node.run,
      timeout: node.timeout,
      retry: node.retry,
      shell: undefined,
    },
    context,
    bufferOutput,
    hasWhenCondition
  );

  const success = typeof result === 'boolean' ? result : result.success;
  if (success || !node.onError) return result;
  return executeRunChain(
    deps,
    node.onError as RunChainNode,
    context,
    bufferOutput,
    hasWhenCondition
  );
}

/**
 * Execute a run step (main run + optional onError chain).
 * Returns same types as before; stores main run success in workspace.
 */
export async function executeRunStep(
  deps: IRunStepHandlerDeps,
  step: Pick<RunStep, 'run' | 'timeout' | 'retry' | 'onError' | 'shell' | 'captures'>,
  context: ExecutionContext,
  bufferOutput: boolean = false,
  hasWhenCondition: boolean = false
): Promise<boolean | TaskRunResult> {
  const { workspace } = deps;

  // If captures are present, we need to collect stdout, so force bufferOutput to true
  // Explicitly handle false vs undefined: if bufferOutput is explicitly false, keep it false unless captures exist
  const shouldBufferOutput =
    bufferOutput === true || (step.captures && step.captures.length > 0) ? true : false;

  const mainResult = await executeSingleRun(
    deps,
    {
      run: step.run,
      timeout: step.timeout,
      retry: step.retry,
      shell: step.shell,
    },
    context,
    shouldBufferOutput,
    hasWhenCondition
  );

  const mainSuccess = typeof mainResult === 'boolean' ? mainResult : mainResult.success;
  workspace.setStepResult(context.stepIndex, mainSuccess);

  // Display buffered output if we buffered it (for captures or parallel execution)
  if (shouldBufferOutput && typeof mainResult === 'object' && 'stdout' in mainResult) {
    const command = substituteVariables(step.run.trim(), workspace);
    const displayName =
      step.run.trim() !== command ? `${command}\n  (template: ${step.run})` : command;
    deps.taskRunner.displayBufferedOutput(
      mainResult,
      displayName,
      false, // isNested
      context.lineNumber,
      context.fileName
    );
  }

  // Process captures if present and result is TaskRunResult
  if (step.captures && typeof mainResult === 'object' && 'stdout' in mainResult) {
    const stdout = mainResult.stdout || [];
    for (const capture of step.captures) {
      const parsedValue = parseCapture(capture, stdout);
      if (parsedValue !== null && capture.as) {
        workspace.setVariable(capture.as, parsedValue);
      }
      // If parsing failed, skip this capture and continue with next one
    }
  }

  if (mainSuccess || !step.onError) return mainResult;

  const rootNode: RunChainNode = {
    run: step.onError.run,
    timeout: step.onError.timeout,
    retry: step.onError.retry,
    onError: step.onError.onError ?? undefined,
  };

  const onErrorResult = await executeRunChain(
    deps,
    rootNode,
    context,
    bufferOutput,
    hasWhenCondition
  );
  return onErrorResult;
}
