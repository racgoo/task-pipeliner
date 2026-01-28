import { ExecutionContext } from '../core/executor';
import { TaskRunResult } from '../core/task-runner';
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
  retry?: number; // number of retries on failure (optional, default: 0)
  continue?: boolean; // if true, continue workflow even if this chain ultimately fails
  onError?: RunStepOnError; // nested fallback chain
}

export interface RunStep {
  run: string; // command to run
  when?: Condition; // mainly used for choice conditions
  timeout?: number; // timeout in seconds (optional)
  retry?: number; // number of retries on failure (optional, default: 0)
  onError?: RunStepOnError;
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
 * Complete workflow
 */
export interface Workflow {
  name?: string;
  baseDir?: string; // Base directory for command execution (relative or absolute path)
  steps: Step[];
  _lineNumbers?: Map<number, number>; // step index -> line number
  _fileName?: string; // YAML file name (for display)
  _filePath?: string; // YAML file absolute path (for resolving relative baseDir)
}

export type StepResult = TaskRunResult | boolean | void;

export type StepStatus = 'success' | 'failure';
