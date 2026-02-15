/**
 * Execution-layer shared types.
 * Kept in @tp-types to avoid core <-> types circular dependencies.
 */
export interface ExecutionContext<TWorkspace = unknown> {
  workspace: TWorkspace;
  stepIndex: number;
  branchIndex?: number;
  lineNumber?: number;
  fileName?: string;
}

export interface TaskRunResult {
  success: boolean;
  stdout: string[];
  stderr: string[];
}
