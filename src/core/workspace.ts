/**
 * Workspace State Management
 * Manages facts, choices, and step results
 */

export interface WorkspaceState {
  facts: Map<string, boolean | string>;
  choices: Map<string, string>;
  variables: Map<string, string>; // Variables for {{variable}} syntax
  stepResults: Map<number, { success: boolean; exitCode?: number }>;
  lastStepIndex: number;
}

export class Workspace {
  private state: WorkspaceState;

  constructor() {
    this.state = {
      facts: new Map(),
      choices: new Map(),
      variables: new Map(),
      stepResults: new Map(),
      lastStepIndex: -1,
    };
  }

  // ============================================
  // Facts Management
  // ============================================

  /**
   * Check if a fact exists
   */
  hasFact(name: string): boolean {
    return this.state.facts.has(name);
  }

  /**
   * Get a fact value
   */
  getFact(name: string): boolean | string | undefined {
    return this.state.facts.get(name);
  }

  /**
   * Set a fact value
   */
  setFact(name: string, value: boolean | string): void {
    this.state.facts.set(name, value);
  }

  /**
   * Get fact status: ready, failed, or pending
   */
  getFactStatus(name: string): 'ready' | 'failed' | 'pending' {
    if (!this.hasFact(name)) {
      return 'pending';
    }
    const value = this.getFact(name);
    return value === false || value === 'failed' ? 'failed' : 'ready';
  }

  /**
   * Get all facts (used for merging after parallel execution)
   */
  getAllFacts(): Map<string, boolean | string> {
    return new Map(this.state.facts);
  }

  // ============================================
  // Choices Management
  // ============================================

  /**
   * Check if a choice exists
   */
  hasChoice(id: string): boolean {
    return this.state.choices.has(id);
  }

  /**
   * Get a choice value
   */
  getChoice(id: string): string | undefined {
    return this.state.choices.get(id);
  }

  /**
   * Set a choice value
   */
  setChoice(id: string, value: string): void {
    this.state.choices.set(id, value);
  }

  // ============================================
  // Variables Management
  // ============================================

  /**
   * Check if a variable exists
   */
  hasVariable(name: string): boolean {
    return this.state.variables.has(name);
  }

  /**
   * Get a variable value
   */
  getVariable(name: string): string | undefined {
    return this.state.variables.get(name);
  }

  /**
   * Set a variable value
   */
  setVariable(name: string, value: string): void {
    this.state.variables.set(name, value);
  }

  /**
   * Get all variables (used for merging after parallel execution)
   */
  getAllVariables(): Map<string, string> {
    return new Map(this.state.variables);
  }

  // ============================================
  // Step Results Management
  // ============================================

  /**
   * Set step execution result
   */
  setStepResult(index: number, success: boolean, exitCode?: number): void {
    this.state.stepResults.set(index, { success, exitCode });
    this.state.lastStepIndex = index;
  }

  /**
   * Get step execution result by index
   */
  getStepResult(index: number): { success: boolean; exitCode?: number } | undefined {
    return this.state.stepResults.get(index);
  }

  /**
   * Get the last executed step result
   */
  getLastStepResult(): { success: boolean; exitCode?: number } | undefined {
    if (this.state.lastStepIndex === -1) {
      return undefined;
    }
    return this.state.stepResults.get(this.state.lastStepIndex);
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Clone workspace state (used for parallel execution)
   * Each parallel branch gets its own workspace copy
   */
  clone(): Workspace {
    const cloned = new Workspace();
    cloned.state.facts = new Map(this.state.facts);
    cloned.state.choices = new Map(this.state.choices);
    cloned.state.variables = new Map(this.state.variables);
    cloned.state.stepResults = new Map(this.state.stepResults);
    cloned.state.lastStepIndex = this.state.lastStepIndex;
    return cloned;
  }
}
