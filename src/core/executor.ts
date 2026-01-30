import { resolve, isAbsolute, dirname } from 'path';
import chalk from 'chalk';
import logUpdate from 'log-update';
import { ChoicePrompt, TextPrompt } from '../cli/prompts';
import {
  createParallelHeaderBox,
  createParallelFooterMessage,
  createErrorBox,
  createStepFooterMessage,
  formatDuration,
} from '../cli/ui';
import type { Condition } from '../types/condition';
import type {
  Step,
  Workflow,
  ChooseStep,
  PromptStep,
  StepResult,
  RunStep,
  RunStepOnError,
} from '../types/workflow';
import { ConditionEvaluator } from './condition-evaluator';
import { WorkflowRecorder } from './recorder';
import { TaskRunner, type TaskRunResult } from './task-runner';
import { substituteVariables } from './template';
import { Workspace } from './workspace';

/**
 * Workflow Executor
 *
 * This class executes workflow steps sequentially, handling:
 * - Step execution (run, choose, prompt, parallel, fail)
 * - Condition evaluation (when clauses)
 * - Variable substitution
 * - Parallel execution with workspace cloning
 * - Error handling and reporting
 */
export interface ExecutionContext {
  workspace: Workspace; // Shared workspace for storing facts, choices, variables
  stepIndex: number; // Current step index in the workflow
  branchIndex?: number; // Branch index for parallel execution (0, 1, 2, ...)
  lineNumber?: number; // Line number in YAML file (for error reporting)
  fileName?: string; // YAML file name (for error reporting)
}

type RunChainNode = Pick<RunStepOnError, 'run' | 'timeout' | 'retry' | 'onError'>;

export class Executor {
  // Multiply step index by this to encode branch index in parallel execution
  // Example: step 5, branch 2 = 5000 + 2 = 5002
  private static readonly PARALLEL_STEP_INDEX_MULTIPLIER = 1000;

  private workspace: Workspace;
  private taskRunner: TaskRunner;
  private choicePrompt: ChoicePrompt;
  private textPrompt: TextPrompt;
  private baseDir?: string; // Base directory for command execution

  constructor() {
    this.workspace = new Workspace();
    this.taskRunner = new TaskRunner();
    this.choicePrompt = new ChoicePrompt();
    this.textPrompt = new TextPrompt();
  }

  /**
   * Resolve baseDir path from workflow configuration
   *
   * baseDir determines where commands will be executed:
   * - If absolute path: use as-is
   * - If relative path: resolve relative to YAML file location
   * - If no _filePath: resolve relative to current working directory
   */
  private resolveBaseDir(workflow: Workflow): void {
    if (!workflow.baseDir) {
      return; // No baseDir specified, use default (process.cwd())
    }

    // Absolute path: use directly
    if (isAbsolute(workflow.baseDir)) {
      this.baseDir = workflow.baseDir;
    }
    // Relative path: resolve against YAML file directory
    else if (workflow._filePath) {
      const yamlDir = dirname(workflow._filePath);
      this.baseDir = resolve(yamlDir, workflow.baseDir);
    }
    // Fallback: resolve against current working directory
    else {
      this.baseDir = resolve(process.cwd(), workflow.baseDir);
    }
  }

  /**
   * Create execution context for a step
   *
   * Context contains information needed to execute a step:
   * - Workspace reference (for storing/reading state)
   * - Step index (for tracking which step we're on)
   * - Line number and file name (for error reporting)
   */
  private createStepContext(stepIndex: number, workflow: Workflow): ExecutionContext {
    const context: ExecutionContext = {
      workspace: this.workspace,
      stepIndex,
    };

    // Add line number for better error messages
    if (workflow._lineNumbers) {
      context.lineNumber = workflow._lineNumbers.get(stepIndex);
    }
    // Add file name for better error messages
    if (workflow._fileName) {
      context.fileName = workflow._fileName;
    }

    return context;
  }

  /**
   * Evaluate step condition and return whether step should execute
   */
  private evaluateStepCondition(step: Step): boolean {
    if (!step.when) {
      return true;
    }

    const evaluator = new ConditionEvaluator(this.workspace);
    return evaluator.evaluate(step.when);
  }

  /**
   * Calculate base step index for parallel execution
   * When in parallel, stepIndex is encoded as: baseStepIndex * MULTIPLIER + branchIndex
   * So we divide by MULTIPLIER to get the original step index
   */
  private calculateBaseStepIndex(context: ExecutionContext): number {
    if (context.branchIndex === undefined) {
      return context.stepIndex;
    }
    return Math.floor(context.stepIndex / Executor.PARALLEL_STEP_INDEX_MULTIPLIER);
  }

  /**
   * Determine if a step is a run step
   */
  private isRunStep(step: Step): step is RunStep {
    return 'run' in step;
  }

  /**
   * Execute workflow steps sequentially
   *
   * Main entry point for workflow execution:
   * 1. Resolve baseDir for command execution
   * 2. Loop through each step
   * 3. Evaluate conditions (when clauses)
   * 4. Execute step if condition passes
   * 5. Check for failures and handle errors
   */
  async execute(workflow: Workflow): Promise<void> {
    // Set up working directory for all commands
    this.resolveBaseDir(workflow);

    const recorder = new WorkflowRecorder();
    const workflowStartTime = Date.now();

    // Execute each step one by one
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const context = this.createStepContext(i, workflow);

      // Check if step has a condition (when clause)
      const hasWhenCondition = !!step.when;

      // Skip step if condition is not met
      if (!this.evaluateStepCondition(step)) {
        continue;
      }

      // Record the start of the step execution
      recorder.recordStart();

      try {
        // Execute the step (run, choose, prompt, parallel, or fail)
        const stepResult = await this.executeStep(step, context, false, hasWhenCondition);
        this.handleStepResult(step, context, i, stepResult, recorder);
      } catch (error) {
        this.handleStepError(step, context, i, error, recorder);
        throw error;
      }
    }

    // Calculate and display total execution time
    const totalDuration = Date.now() - workflowStartTime;
    const totalDurationStr = formatDuration(totalDuration);
    console.log(chalk.cyan(`\nTotal execution time: ${totalDurationStr}`));

    // Save the recorded results
    await recorder.save();
    // Reset the recorder for next execution(it's not necessary to reset the recorder after each execution)
    recorder.reset();
  }

  /**
   * Check if step result indicates success
   */
  private isStepSuccessful(stepResult: TaskRunResult | boolean | void, step: Step): boolean {
    if (!('run' in step)) {
      return true; // Non-run steps don't have success/failure
    }
    if (typeof stepResult === 'boolean') {
      return stepResult;
    }
    if (stepResult && typeof stepResult === 'object' && 'success' in stepResult) {
      return stepResult.success;
    }
    return false;
  }

  /**
   * Handle successful or failed step result
   * The `continue` flag controls whether to proceed to the next step regardless of success/failure
   */
  private handleStepResult(
    step: Step,
    context: ExecutionContext,
    stepIndex: number,
    stepResult: StepResult,
    recorder: WorkflowRecorder
  ): void {
    // For run steps, success is determined by the main run result stored in workspace,
    // not by any onError fallback that may have executed.
    const isSuccessful = this.isRunStep(step)
      ? (() => {
          const stored = this.workspace.getStepResult(stepIndex);
          return stored ? stored.success : true;
        })()
      : this.isStepSuccessful(stepResult, step);

    const status: 'success' | 'failure' = isSuccessful ? 'success' : 'failure';

    // Record the step and get duration
    const duration = recorder.recordEnd(step, context, stepResult, status);

    // Display duration for non-run steps (run steps display duration in task-runner)
    if (!this.isRunStep(step)) {
      const footerMessage = createStepFooterMessage(isSuccessful, false, duration);
      console.log(footerMessage);
    }

    // Check continue flag for run steps
    // continue: false -> stop workflow (regardless of success/failure)
    // continue: true -> continue to next step (regardless of success/failure)
    // continue: undefined -> default behavior (continue on success, stop on failure)
    if (this.isRunStep(step)) {
      if (step.continue === false) {
        // Stop workflow regardless of success/failure
        const lineInfo = context.lineNumber ? ` (line ${context.lineNumber})` : '';
        const message = isSuccessful
          ? `Step ${stepIndex}${lineInfo} completed, but workflow stopped due to continue: false`
          : `Step ${stepIndex}${lineInfo} failed`;
        throw new Error(message);
      }
      // If continue is true or undefined, check default behavior for failure
      if (!isSuccessful && step.continue !== true) {
        // Default: stop on failure (when continue is not explicitly true)
        const lineInfo = context.lineNumber ? ` (line ${context.lineNumber})` : '';
        throw new Error(`Step ${stepIndex}${lineInfo} failed`);
      }
      // If continue is true, proceed regardless of success/failure
      // If continue is undefined and successful, proceed (handled by not throwing)
    }
  }

  /**
   * Handle errors thrown during step execution
   */
  private handleStepError(
    step: Step,
    context: ExecutionContext,
    stepIndex: number,
    error: unknown,
    recorder: WorkflowRecorder
  ): void {
    // Mark step as failed in workspace
    this.workspace.setStepResult(stepIndex, false);
    // Convert error to TaskRunResult format for recording
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorResult: TaskRunResult = {
      success: false,
      stdout: [],
      stderr: [errorMessage],
    };
    // Record the error result(all error contains in stderr)
    recorder.recordEnd(step, context, errorResult, 'failure');
  }

  /**
   * Fix malformed step (YAML indentation issue)
   * When choose/prompt is null but properties exist at step level
   * This happens when YAML is incorrectly indented
   */
  private fixMalformedStep(step: Step): Step {
    // Type guard: check if step has malformed choose structure
    const stepAsUnknown = step as unknown;
    const stepAsRecord = stepAsUnknown as Record<string, unknown>;
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

    // Type guard: check if step has malformed prompt structure
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

  /**
   * Execute a single step based on its type
   *
   * Steps can be:
   * - run: Execute a shell command
   * - choose: Show user a choice menu
   * - prompt: Ask user for text input
   * - parallel: Execute multiple steps in parallel
   * - fail: Intentionally fail with a message
   *
   * @param bufferOutput - If true, collect output instead of displaying immediately (for parallel)
   * @param hasWhenCondition - If true, step has a condition (affects UI color)
   */
  private async executeStep(
    step: Step,
    context: ExecutionContext,
    bufferOutput: boolean = false,
    hasWhenCondition: boolean = false
  ): Promise<StepResult> {
    // Fix YAML parsing issues (when indentation is wrong)
    step = this.fixMalformedStep(step);

    // Execute shell command
    if ('run' in step) {
      const result = await this.executeRunStep(step, context, bufferOutput, hasWhenCondition);
      // Return TaskRunResult if buffering, boolean otherwise
      return bufferOutput && typeof result === 'object' && 'stdout' in result ? result : result;
    }

    // Show choice menu to user
    if ('choose' in step) {
      await this.executeChooseStep(step, context);
      return;
    }

    // Ask user for text input
    if ('prompt' in step) {
      await this.executePromptStep(step, context);
      return;
    }

    // Execute multiple steps in parallel
    if ('parallel' in step) {
      await this.executeParallelStep(step, context);
      return;
    }

    // Intentionally fail with error message
    if ('fail' in step) {
      await this.executeFailStep(step, context);
      return;
    }
  }

  /**
   * Execute a single run command (without onError handling)
   *
   * Steps:
   * 1. Calculate base step index (for parallel execution)
   * 2. Substitute variables in command ({{variable}} syntax)
   * 3. Run command via TaskRunner (with retry logic if specified)
   */
  private async executeSingleRun(
    step: Pick<RunStep, 'run' | 'timeout' | 'retry'>,
    context: ExecutionContext,
    bufferOutput: boolean = false,
    hasWhenCondition: boolean = false
  ): Promise<boolean | TaskRunResult> {
    // For parallel steps, extract the base step index
    const baseStepIndex = this.calculateBaseStepIndex(context);

    // Replace {{variable}} with actual values from workspace
    const command = substituteVariables(step.run, this.workspace);

    // Get retry count (default: 0, meaning no retry)
    const retryCount = step.retry ?? 0;
    const timeoutSeconds = step.timeout;

    // Execute with retry logic
    let lastResult: boolean | TaskRunResult = false;
    let attempt = 0;

    while (attempt <= retryCount) {
      // Execute the command
      const result = await this.taskRunner.run(
        command,
        baseStepIndex,
        command,
        context.branchIndex,
        bufferOutput,
        hasWhenCondition,
        context.lineNumber,
        context.fileName,
        this.baseDir,
        timeoutSeconds
      );

      // Extract success status
      const success = typeof result === 'boolean' ? result : result.success;
      lastResult = result;

      // If successful or no more retries, break
      if (success || attempt >= retryCount) {
        break;
      }

      // If failed and retries remaining, wait a bit before retrying
      attempt++;
      if (attempt <= retryCount) {
        // Small delay before retry (exponential backoff: 1s, 2s, 4s...)
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return lastResult;
  }

  /**
   * Execute a run step with recursive onError chain
   *
   * The onError chain is modeled as a linked list of run-like steps:
   * main -> onError -> onError -> ...
   * The final success is determined by the last executed command in the chain.
   */
  private async executeRunStep(
    step: Pick<RunStep, 'run' | 'timeout' | 'retry' | 'onError'>,
    context: ExecutionContext,
    bufferOutput: boolean = false,
    hasWhenCondition: boolean = false
  ): Promise<boolean | TaskRunResult> {
    // Execute main run first
    const mainResult = await this.executeSingleRun(
      {
        run: step.run,
        timeout: step.timeout,
        retry: step.retry,
      },
      context,
      bufferOutput,
      hasWhenCondition
    );

    const mainSuccess = typeof mainResult === 'boolean' ? mainResult : mainResult.success;

    // Store ONLY main run success status in workspace for this step index.
    // onError fallback execution does not change step success/failure.
    this.workspace.setStepResult(context.stepIndex, mainSuccess);

    // If main run succeeded, do not execute onError chain
    if (mainSuccess || !step.onError) {
      return mainResult;
    }

    // If main run failed and onError exists, execute onError chain for side effects only.
    // The step remains failed regardless of onError results; workspace stepResult is not updated.
    const rootNode: RunChainNode = {
      run: step.onError.run,
      timeout: step.onError.timeout,
      retry: step.onError.retry,
      onError: step.onError.onError ?? undefined,
    };

    const onErrorResult = await this.executeRunChain(
      rootNode,
      context,
      bufferOutput,
      hasWhenCondition
    );

    // Return the last onError result (for logging/buffering),
    // but step success is still determined solely by mainSuccess above.
    return onErrorResult;
  }

  /**
   * Execute a run-like node and its nested onError chain
   */
  private async executeRunChain(
    node: RunChainNode,
    context: ExecutionContext,
    bufferOutput: boolean,
    hasWhenCondition: boolean
  ): Promise<boolean | TaskRunResult> {
    const result = await this.executeSingleRun(
      {
        run: node.run,
        timeout: node.timeout,
        retry: node.retry,
      },
      context,
      bufferOutput,
      hasWhenCondition
    );

    const success = typeof result === 'boolean' ? result : result.success;

    // On success, stop the chain
    if (success || !node.onError) {
      return result;
    }

    // On failure and onError exists, execute the next node in the chain
    return this.executeRunChain(
      node.onError as RunChainNode,
      context,
      bufferOutput,
      hasWhenCondition
    );
  }

  /**
   * Execute a choose step (show user a selection menu)
   *
   * User selects from options, and the choice is stored:
   * - As a choice (for when: { choice: 'id' } conditions) - uses choice id
   * - As a variable (for {{variable}} substitution) - uses 'as' field if provided, otherwise choice id
   */
  private async executeChooseStep(
    step: {
      choose: { message: string; options: Array<{ id: string; label: string }>; as?: string };
    },
    context: ExecutionContext
  ): Promise<void> {
    // Show choice menu to user
    const choice = await this.choicePrompt.prompt(step.choose.message, step.choose.options);

    // Validate choice result
    if (!choice?.id) {
      throw new Error(`Invalid choice result: ${JSON.stringify(choice)}`);
    }

    // Determine variable name: use 'as' field if provided, otherwise use choice id
    const variableName = step.choose.as ?? choice.id;

    // Store choice in workspace (for conditions - always uses choice id)
    this.workspace.setChoice(choice.id, choice.id);

    // Store as variable (for {{variable}} substitution - uses 'as' field if provided)
    this.workspace.setVariable(variableName, choice.id);

    this.workspace.setStepResult(context.stepIndex, true);
  }

  /**
   * Execute a prompt step (ask user for text input)
   *
   * User enters text, which is stored:
   * - As a variable (for {{variable}} substitution)
   * - As a fact (for when: { var: 'name' } conditions)
   */
  private async executePromptStep(
    step: { prompt: { message: string; as: string; default?: string } },
    context: ExecutionContext
  ): Promise<void> {
    // Substitute variables in message and default value
    const message = substituteVariables(step.prompt.message, this.workspace);
    const defaultValue = step.prompt.default
      ? substituteVariables(step.prompt.default, this.workspace)
      : undefined;

    // Ask user for input
    const value = await this.textPrompt.prompt(message, defaultValue);

    // Store input in workspace (as both variable and fact)
    this.workspace.setVariable(step.prompt.as, value);
    this.workspace.setFact(step.prompt.as, value);
    this.workspace.setStepResult(context.stepIndex, true);
  }

  /**
   * Create execution contexts for parallel branches
   * Encodes branch index into stepIndex: baseStepIndex * MULTIPLIER + branchIndex
   * Each branch inherits line number and file name from the parallel step
   */
  private createParallelContexts(
    step: { parallel: Step[] },
    baseContext: ExecutionContext
  ): ExecutionContext[] {
    return step.parallel.map((_, branchIndex) => ({
      workspace: this.workspace.clone(),
      stepIndex: baseContext.stepIndex * Executor.PARALLEL_STEP_INDEX_MULTIPLIER + branchIndex,
      branchIndex: branchIndex,
      lineNumber: baseContext.lineNumber, // Inherit line number from parallel step
      fileName: baseContext.fileName, // Inherit file name from parallel step
    }));
  }

  /**
   * Get display name for a parallel branch step
   */
  private getBranchDisplayName(step: Step, index: number): string {
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

  /**
   * Execute all parallel branches simultaneously
   *
   * Each branch:
   * 1. Has its own workspace clone (isolated state)
   * 2. Evaluates its own conditions
   * 3. Executes in buffer mode (collects output, don't display yet)
   * 4. Returns result or error
   *
   * All branches run at the same time using Promise.all()
   * Uses log-update to show all branch statuses in real-time
   */
  private async executeParallelBranches(
    steps: Step[],
    contexts: ExecutionContext[]
  ): Promise<
    Array<{
      index: number;
      result?: TaskRunResult;
      error?: unknown;
      context: ExecutionContext;
    } | null>
  > {
    // Track branch statuses
    interface BranchStatus {
      index: number;
      name: string;
      status: 'pending' | 'running' | 'success' | 'failed';
      error?: string;
    }

    const branchStatuses: BranchStatus[] = [];
    const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let spinnerFrameIndex = 0;

    // Initialize branch statuses
    for (let i = 0; i < steps.length; i++) {
      const parallelStep = steps[i];
      const branchContext = contexts[i];

      // Evaluate condition for this branch
      if (parallelStep.when) {
        const evaluator = new ConditionEvaluator(branchContext.workspace);
        const conditionResult = evaluator.evaluate(parallelStep.when);
        if (!conditionResult) {
          continue; // Skip this branch
        }
      }

      const branchName = this.getBranchDisplayName(parallelStep, i);
      branchStatuses.push({
        index: i,
        name: branchName,
        status: 'pending',
      });
    }

    // Start spinner animation
    const spinnerInterval = setInterval(() => {
      spinnerFrameIndex = (spinnerFrameIndex + 1) % spinnerFrames.length;
      this.updateParallelBranchesDisplay(branchStatuses, spinnerFrames[spinnerFrameIndex]);
    }, 100);

    // Create promises for all branches
    const promises = branchStatuses.map(async (branchStatus) => {
      const { index } = branchStatus;
      const parallelStep = steps[index];
      const branchContext = contexts[index];

      // Mark as running
      branchStatus.status = 'running';

      try {
        // Execute step in buffer mode (collect output, don't display yet)
        const result = await this.executeStep(parallelStep, branchContext, true);

        // Mark as success
        branchStatus.status = 'success';
        this.updateParallelBranchesDisplay(branchStatuses, spinnerFrames[spinnerFrameIndex]);

        return { index, result: result as TaskRunResult, context: branchContext };
      } catch (error) {
        // Mark branch as failed
        branchContext.workspace.setStepResult(branchContext.stepIndex, false);

        // Mark as failed
        const errorMessage = error instanceof Error ? error.message : String(error);
        branchStatus.status = 'failed';
        branchStatus.error = errorMessage;
        this.updateParallelBranchesDisplay(branchStatuses, spinnerFrames[spinnerFrameIndex]);

        return { index, error, context: branchContext };
      }
    });

    // Wait for all branches to complete
    const results = await Promise.all(promises);

    // Stop spinner and show final status
    clearInterval(spinnerInterval);
    this.updateParallelBranchesDisplay(branchStatuses, '', true);
    logUpdate.done();

    return results;
  }

  /**
   * Update parallel branches display using log-update
   */
  private updateParallelBranchesDisplay(
    branchStatuses: Array<{
      index: number;
      name: string;
      status: 'pending' | 'running' | 'success' | 'failed';
      error?: string;
    }>,
    spinner: string,
    final: boolean = false
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

    if (final) {
      // Final display - show all statuses
      logUpdate(lines.join('\n'));
    } else {
      // Live update
      logUpdate(lines.join('\n'));
    }
  }

  /**
   * Display parallel execution results
   * Status display is already done, now we show the detailed output
   */
  private displayParallelResults(
    results: Array<{
      index: number;
      result?: TaskRunResult;
      error?: unknown;
      context: ExecutionContext;
    } | null>,
    steps: Step[],
    _context: ExecutionContext
  ): boolean {
    let allBranchesSucceeded = true;
    let hasAnyResult = false;

    // Add a blank line after spinners
    console.log('');

    for (const result of results) {
      if (!result) continue;

      hasAnyResult = true;
      const { index, result: stepResult, error, context: branchContext } = result;

      if (error) {
        allBranchesSucceeded = false;
        // Error was already shown by spinner, but show detailed error box
        const errorMessage = `Branch ${index + 1} failed: ${error instanceof Error ? error.message : String(error)}`;
        const errorBox = createErrorBox(errorMessage);
        console.error(errorBox);
      } else if (stepResult && typeof stepResult === 'object' && 'stdout' in stepResult) {
        const taskResult = stepResult;
        allBranchesSucceeded = allBranchesSucceeded && taskResult.success;

        // Only show output if there's actual output or if it failed
        if (taskResult.stdout.length > 0 || taskResult.stderr.length > 0 || !taskResult.success) {
          const parallelStep = steps[index];
          const stepName = this.getBranchDisplayName(parallelStep, index);
          // Use branch context's line number and file name for display
          this.taskRunner.displayBufferedOutput(
            taskResult,
            stepName,
            false,
            branchContext.lineNumber,
            branchContext.fileName
          );
        }
      }
    }

    // If no branches executed (all were skipped due to conditions), show a message
    if (!hasAnyResult) {
      console.log('⚠️  All parallel branches were skipped (conditions not met)');
    }

    const parallelFooterMessage = createParallelFooterMessage(allBranchesSucceeded);
    console.log(parallelFooterMessage);

    return allBranchesSucceeded;
  }

  /**
   * Merge facts and variables from parallel branches
   */
  private mergeParallelResults(contexts: ExecutionContext[]): void {
    for (const branchContext of contexts) {
      const facts = branchContext.workspace.getAllFacts();
      const variables = branchContext.workspace.getAllVariables();

      for (const [key, value] of facts) {
        this.workspace.setFact(key, value);
      }
      for (const [key, value] of variables) {
        this.workspace.setVariable(key, value);
      }
    }
  }

  /**
   * Count how many branches will actually execute (after when condition evaluation)
   */
  private countExecutableBranches(steps: Step[], contexts: ExecutionContext[]): number {
    let count = 0;
    for (let i = 0; i < steps.length; i++) {
      const parallelStep = steps[i];
      const branchContext = contexts[i];

      // Evaluate condition for this branch
      if (parallelStep.when) {
        const evaluator = new ConditionEvaluator(branchContext.workspace);
        const conditionResult = evaluator.evaluate(parallelStep.when);
        if (!conditionResult) {
          continue; // Skip this branch
        }
      }
      count++;
    }
    return count;
  }

  /**
   * Execute a parallel step (run multiple steps simultaneously)
   *
   * Process:
   * 1. Create isolated contexts for each branch (with cloned workspaces)
   * 2. Count how many branches will actually execute
   * 3. Show header box with actual executable branch count
   * 4. Execute all branches in parallel
   * 5. Display results
   * 6. Merge facts and variables from all branches back to main workspace
   * 7. Throw error if any branch failed
   */
  private async executeParallelStep(
    step: { parallel: Step[] },
    context: ExecutionContext
  ): Promise<void> {
    // Create isolated contexts for each branch (each has its own workspace clone)
    const parallelContexts = this.createParallelContexts(step, context);

    // Count how many branches will actually execute (after when condition evaluation)
    const executableBranchCount = this.countExecutableBranches(step.parallel, parallelContexts);

    // Show parallel execution header with actual executable branch count
    const parallelHeaderBox = createParallelHeaderBox(executableBranchCount);
    console.log(parallelHeaderBox);

    // Execute all branches at the same time
    const results = await this.executeParallelBranches(step.parallel, parallelContexts);

    // Display results and check if all succeeded
    const allBranchesSucceeded = this.displayParallelResults(results, step.parallel, context);

    // Store overall result
    this.workspace.setStepResult(context.stepIndex, allBranchesSucceeded);

    // If any branch failed, throw error
    if (!allBranchesSucceeded) {
      const lineInfo = context.lineNumber ? ` (line ${context.lineNumber})` : '';
      throw new Error(
        `Parallel step ${context.stepIndex}${lineInfo} failed: one or more branches failed`
      );
    }

    // Merge all facts and variables from branches back to main workspace
    this.mergeParallelResults(parallelContexts);
  }

  private async executeFailStep(
    step: { fail: { message: string } },
    _context: ExecutionContext
  ): Promise<void> {
    const error = new Error(step.fail.message);
    // Remove stack trace for cleaner error messages
    error.stack = undefined;
    throw error;
  }
}
