import { resolve, isAbsolute, dirname } from 'path';
import chalk from 'chalk';
import { ChoicePrompt, TextPrompt } from '../cli/prompts';
import { generateTimeline } from '../cli/timeline';
import { createStepFooterMessage, formatDuration } from '../cli/ui';
import type { Condition } from '../types/condition';
import type {
  Step,
  Workflow,
  ChooseStep,
  PromptStep,
  StepResult,
  RunStep,
} from '../types/workflow';
import { ConditionEvaluator } from './condition-evaluator';
import {
  executeParallelStep as executeParallelStepHandler,
  PARALLEL_STEP_INDEX_MULTIPLIER,
} from './executor/parallel-step-handler';
import { executeRunStep } from './executor/run-step-handler';
import { WorkflowRecorder } from './recorder';
import { TaskRunner, type TaskRunResult } from './task-runner';
import { substituteVariables } from './template';
import { Workspace } from './workspace';

/**
 * Options for workflow execution (e.g. profile variables for non-interactive runs)
 */
export interface ExecuteOptions {
  /**
   * Pre-set variables from --profile <name>. Choose/prompt steps that write to these
   * variables are skipped and the profile value is used.
   */
  profileVars?: Record<string, string>;
}

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

export class Executor {
  private workspace: Workspace;
  private taskRunner: TaskRunner;
  private choicePrompt: ChoicePrompt;
  private textPrompt: TextPrompt;
  private baseDir?: string; // Base directory for command execution
  private globalShell?: string[]; // Global shell configuration from workflow

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
    return Math.floor(context.stepIndex / PARALLEL_STEP_INDEX_MULTIPLIER);
  }

  /**
   * Determine if a step is a run step
   */
  private isRunStep(step: Step): step is RunStep {
    return 'run' in step;
  }

  /**
   * Get resolved values for a step (for history record display)
   */
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

  /**
   * Execute workflow steps sequentially
   *
   * Main entry point for workflow execution:
   * 1. Optionally seed workspace with profile variables
   * 2. Resolve baseDir for command execution
   * 3. Loop through each step
   * 4. Evaluate conditions (when clauses)
   * 5. Execute step if condition passes (choose/prompt skipped when variable already set)
   * 6. Check for failures and handle errors
   */
  async execute(workflow: Workflow, options?: ExecuteOptions): Promise<void> {
    // Seed workspace with profile variables when running with --profile
    if (options?.profileVars && Object.keys(options.profileVars).length > 0) {
      for (const [key, value] of Object.entries(options.profileVars)) {
        this.workspace.setVariable(key, value);
      }
    }

    // Set up working directory for all commands
    this.resolveBaseDir(workflow);

    // Set up global shell configuration
    this.globalShell = workflow.shell;

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

    // Generate and display timeline
    const history = recorder.getHistory();
    const timeline = generateTimeline(history);
    if (timeline) {
      console.log(timeline);
    }

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

    // Resolved values for history display
    const resolved = this.getRecordResolved(step);
    const duration = recorder.recordEnd(step, context, stepResult, status, resolved);

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
    const resolved = this.getRecordResolved(step);
    recorder.recordEnd(step, context, errorResult, 'failure', resolved);
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
      const result = await executeRunStep(
        {
          workspace: this.workspace,
          taskRunner: this.taskRunner,
          baseDir: this.baseDir,
          globalShell: this.globalShell,
          calculateBaseStepIndex: (ctx) => this.calculateBaseStepIndex(ctx),
        },
        step,
        context,
        bufferOutput,
        hasWhenCondition
      );
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
      await executeParallelStepHandler(
        {
          workspace: this.workspace,
          taskRunner: this.taskRunner,
          executeStep: (s, ctx, bufferOutput) => this.executeStep(s, ctx, bufferOutput, !!s.when),
          setStepResult: (stepIndex, success) => this.workspace.setStepResult(stepIndex, success),
        },
        step,
        context
      );
      return;
    }

    // Intentionally fail with error message
    if ('fail' in step) {
      await this.executeFailStep(step, context);
      return;
    }
  }

  /**
   * Execute a choose step (show user a selection menu)
   *
   * User selects from options, and the choice is stored:
   * - As a choice (for when: { choice: 'id' } conditions) - uses choice id
   * - As a variable (for {{variable}} substitution) - uses 'as' field if provided, otherwise choice id
   *
   * When running with --profile, if the variable (step.choose.as) is already set and matches
   * an option id, the prompt is skipped and the profile value is used.
   */
  private async executeChooseStep(
    step: {
      choose: { message: string; options: Array<{ id: string; label: string }>; as?: string };
    },
    context: ExecutionContext
  ): Promise<void> {
    const variableName = step.choose.as;
    const optionIds = step.choose.options.map((o) => o.id);

    // Profile mode: variable already set and matches an option id -> skip prompt
    if (variableName && this.workspace.hasVariable(variableName)) {
      const value = this.workspace.getVariable(variableName) ?? '';
      if (optionIds.includes(value)) {
        this.workspace.setChoice(value, value);
        this.workspace.setStepResult(context.stepIndex, true);
        return;
      }
    }

    // Show choice menu to user
    const choice = await this.choicePrompt.prompt(step.choose.message, step.choose.options);

    // Validate choice result
    if (!choice?.id) {
      throw new Error(`Invalid choice result: ${JSON.stringify(choice)}`);
    }

    // Determine variable name: use 'as' field if provided, otherwise use choice id
    const resolvedVariableName = variableName ?? choice.id;

    // Store choice in workspace (for conditions - always uses choice id)
    this.workspace.setChoice(choice.id, choice.id);

    // Store as variable (for {{variable}} substitution - uses 'as' field if provided)
    this.workspace.setVariable(resolvedVariableName, choice.id);

    this.workspace.setStepResult(context.stepIndex, true);
  }

  /**
   * Execute a prompt step (ask user for text input)
   *
   * User enters text, which is stored:
   * - As a variable (for {{variable}} substitution)
   * - As a fact (for when: { var: 'name' } conditions)
   *
   * When running with --profile, if the variable (step.prompt.as) is already set,
   * the prompt is skipped and the profile value is used.
   */
  private async executePromptStep(
    step: { prompt: { message: string; as: string; default?: string } },
    context: ExecutionContext
  ): Promise<void> {
    const varName = step.prompt.as;

    // Profile mode: variable already set -> skip prompt
    if (this.workspace.hasVariable(varName)) {
      const value = this.workspace.getVariable(varName) ?? '';
      this.workspace.setFact(varName, value);
      this.workspace.setStepResult(context.stepIndex, true);
      return;
    }

    // Substitute variables in message and default value
    const message = substituteVariables(step.prompt.message, this.workspace);
    const defaultValue = step.prompt.default
      ? substituteVariables(step.prompt.default, this.workspace)
      : undefined;

    // Ask user for input
    const value = await this.textPrompt.prompt(message, defaultValue);

    // Store input in workspace (as both variable and fact)
    this.workspace.setVariable(varName, value);
    this.workspace.setFact(varName, value);
    this.workspace.setStepResult(context.stepIndex, true);
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
