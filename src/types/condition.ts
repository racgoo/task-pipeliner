/**
 * Condition Primitives
 * Conditions ask questions about the workspace, not inspect values
 */

export type ConditionPrimitive =
  | FileExistsCondition
  | ChoiceCondition
  | VarExistsCondition;

export type Condition =
  | ConditionPrimitive
  | AllCondition
  | AnyCondition
  | NotCondition;

/**
 * 1. File/Directory existence check
 */
export interface FileExistsCondition {
  file: string; // file or directory path
}

/**
 * 2. Variable/Fact existence check or value comparison
 */
export interface VarExistsCondition {
  var?: string | Record<string, string>; // variable name (string) or variable value comparison (object)
  has?: string; // variable or fact name (alias, for existence check only)
}

/**
 * 2. Fact status check
 */
export interface StatusCondition {
  status: {
    fact: string;
    is: 'ready' | 'failed' | 'pending';
  };
}

/**
 * 3. Previous step result check
 */
export interface StepCondition {
  step?: {
    success: boolean;
  };
  last_step?: 'success' | 'failure';
}

/**
 * 4. User choice check
 */
export interface ChoiceCondition {
  choice: string; // choice id from choose
}

/**
 * AND combination - all conditions must be true
 */
export interface AllCondition {
  all: Condition[];
}

/**
 * OR combination - any condition can be true
 */
export interface AnyCondition {
  any: Condition[];
}

/**
 * NOT condition - negate a condition
 */
export interface NotCondition {
  not: Condition;
}

