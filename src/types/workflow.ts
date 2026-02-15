import { ExecutionContext } from '@core/executor';
import { TaskRunResult } from '@core/task-runner';
import type { Condition } from './condition';

/**
 * Workflow Step Types
 */
export type Step = RunStep | ChooseStep | PromptStep | ParallelStep | FailStep;

/**
 * Record of workflow execution
 */
export interface Record {
  step: Step;
  context: ExecutionContext;
  output: StepResult;
  duration: number;
  status: StepStatus;
  /** Command after variable substitution (run steps) */
  resolvedCommand?: string;
  /** Selected option id (choose steps) */
  choiceValue?: string;
  /** Entered value (prompt steps) */
  promptValue?: string | boolean;
}

/**
 * History of workflow execution
 */
export interface History {
  initialTimestamp: number;
  records: Record[];
}

/**
 * Basic execution step
 * Workflow stops on failure
 */
export interface RunStepOnError {
  run: string; // fallback command to run on failure
  timeout?: number; // timeout in seconds (optional)
  retry?: number | 'Infinity'; // number of retries on failure (optional, default: 0). Use 'Infinity' for infinite retries
  onError?: RunStepOnError; // nested fallback chain
}

/**
 * Capture strategies for extracting values from stdout
 */
export type Capture =
  | { as: string } // Full stdout capture (no filtering)
  | { regex: string; as: string } // Regex capture (first capture group)
  | { json: string; as: string } // JSONPath extraction from JSON
  | { yaml: string; as: string } // JSONPath extraction from YAML
  | { yml: string; as: string } // Alias for yaml
  | { kv: string; as: string } // Key-value extraction (.env style)
  | { after: string; as: string } // Extract after marker
  | { before: string; as: string } // Extract before marker
  | { after: string; before: string; as: string } // Extract between markers
  | { line: { from: number; to: number }; as: string }; // Extract line range

export interface RunStep {
  run: string; // command to run
  when?: Condition; // mainly used for choice conditions
  timeout?: number; // timeout in seconds (optional)
  retry?: number | 'Infinity'; // number of retries on failure (optional, default: 0). Use 'Infinity' for infinite retries
  shell?: string[]; // shell configuration (e.g., ["bash", "-lc"]) - overrides workflow.shell
  /**
   * If true, continue workflow even if this run step ultimately fails.
   *
   * Semantics:
   * - If main run succeeds, step is successful and workflow continues.
   * - If main run fails:
   *   - onError (if present) is executed for side effects only.
   *   - The step is still considered failed.
   *   - When continue is true, the workflow records failure but moves on to the next step.
   *   - When continue is false/undefined, the workflow stops on this failure.
   */
  continue?: boolean;
  onError?: RunStepOnError;
  /**
   * Capture stdout output and store as variables
   * Each capture defines a strategy to extract a value from stdout
   */
  captures?: Capture[];
}

/**
 * User choice step
 */
export interface ChooseStep {
  choose: {
    message: string;
    options: Array<{
      id: string;
      label: string;
    }>;
    as?: string; // store result as variable (variable name), defaults to choice id
  };
  when?: Condition;
}

/**
 * User input step (prompt)
 */
export interface PromptStep {
  prompt: {
    message: string;
    as: string; // store result as variable (variable name)
    default?: string; // default value
    validate?: string; // validation message (optional)
  };
  when?: Condition;
}

/**
 * Parallel execution step
 */
export interface ParallelStep {
  parallel: Step[];
  when?: Condition;
}

/**
 * Fail step
 */
export interface FailStep {
  fail: {
    message: string;
  };
  when?: Condition;
}

/**
 * Profile: named set of variables used when running with --profile <name>.
 * Skips choose/prompt steps and uses these values for {{variable}} substitution.
 */
export interface Profile {
  name: string;
  var: { [key: string]: string };
}

/**
 * Complete workflow
 */
export interface Workflow {
  name?: string;
  baseDir?: string; // Base directory for command execution (relative or absolute path)
  shell?: string[]; // Global shell configuration (e.g., ["bash", "-lc"])
  /**
   * Optional profiles: pre-defined variable sets for non-interactive runs (tp run --profile <name>).
   * When a profile is used, choose/prompt steps that store into these variables are skipped.
   */
  profiles?: Profile[];
  steps: Step[];
  _lineNumbers?: Map<number, number>; // step index -> line number
  _fileName?: string; // YAML file name (for display)
  _filePath?: string; // YAML file absolute path (for resolving relative baseDir)
}

export type StepResult = TaskRunResult | boolean | void;

export type StepStatus = 'success' | 'failure';
