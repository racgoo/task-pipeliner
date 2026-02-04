/**
 * Workflow Step Types
 */
export type Step =
  | RunStep
  | ChooseStep
  | PromptStep
  | ParallelStep
  | FailStep;

/**
 * Basic execution step
 */
export interface RunStepOnError {
  run: string;
  timeout?: number;
  retry?: number;
  onError?: RunStepOnError;
}

export interface RunStep {
  run: string;
  when?: Condition;
  timeout?: number;
  retry?: number;
  shell?: string[];
  continue?: boolean;
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
    as?: string;
  };
  when?: Condition;
}

/**
 * User input step (prompt)
 */
export interface PromptStep {
  prompt: {
    message: string;
    as: string;
    default?: string;
    validate?: string;
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
 * Condition types
 */
export type Condition =
  | FileExistsCondition
  | VarExistsCondition
  | StatusCondition
  | StepCondition
  | ChoiceCondition
  | AllCondition
  | AnyCondition
  | NotCondition;

export interface FileExistsCondition {
  file: string;
}

export interface VarExistsCondition {
  var?: string | Record<string, string>;
  has?: string;
}

export interface StatusCondition {
  status: {
    fact: string;
    is: 'ready' | 'failed' | 'pending';
  };
}

export interface StepCondition {
  step?: {
    success: boolean;
  };
  last_step?: 'success' | 'failure';
}

export interface ChoiceCondition {
  choice: string;
}

export interface AllCondition {
  all: Condition[];
}

export interface AnyCondition {
  any: Condition[];
}

export interface NotCondition {
  not: Condition;
}

/**
 * Profile: named set of variables for tp run --profile <name>
 */
export interface Profile {
  name: string;
  var: Record<string, string>;
}

/**
 * Complete workflow
 */
export interface Workflow {
  name?: string;
  baseDir?: string;
  shell?: string[];
  profiles?: Profile[];
  steps: Step[];
}

