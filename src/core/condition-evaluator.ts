import { existsSync } from 'fs';
import { resolve } from 'path';
import type { Condition } from '../types/condition';
import type { Workspace } from './workspace';

/**
 * Condition Evaluator
 * Evaluates conditions as questions about the workspace
 */

export class ConditionEvaluator {
  constructor(private workspace: Workspace) {}

  /**
   * Evaluate condition as a question about the workspace
   * Returns true if condition is met, false otherwise
   */
  evaluate(condition: Condition): boolean {
    // Check if variable or fact exists, or compare variable value
    // This should be checked before 'choice' to support var value comparison
    if ('var' in condition || 'has' in condition) {
      return this.evaluateVarExists(condition);
    }

    // Check if file exists
    if ('file' in condition) {
      return this.evaluateFileExists(condition);
    }

    // Check if user made a specific choice (deprecated, use var instead)
    // Kept for backward compatibility
    if ('choice' in condition) {
      return this.evaluateChoice(condition);
    }

    // All conditions must be true (AND)
    if ('all' in condition) {
      return this.evaluateAll(condition);
    }

    // Any condition can be true (OR)
    if ('any' in condition) {
      return this.evaluateAny(condition);
    }

    // Negate a condition (NOT)
    if ('not' in condition) {
      return this.evaluateNot(condition);
    }

    return false;
  }

  /**
   * Check if a variable or fact exists in workspace, or compare variable value
   *
   * Supports two formats:
   * 1. { var: 'name' } - Check if variable exists
   * 2. { var: { name: 'value' } } - Check if variable equals specific value
   */
  private evaluateVarExists(condition: {
    var?: string | Record<string, string>;
    has?: string;
  }): boolean {
    // Handle 'has' alias (existence check only)
    if (condition.has) {
      return this.workspace.hasVariable(condition.has) || this.workspace.hasFact(condition.has);
    }

    if (!condition.var) {
      return false;
    }

    // If var is an object, it's a value comparison: { var: { env: 'dev' } }
    if (typeof condition.var === 'object') {
      // Check each variable-value pair
      for (const [variableName, expectedValue] of Object.entries(condition.var)) {
        // Get variable value (prefer variable over fact)
        const variableValue = this.workspace.getVariable(variableName);
        const factValue = this.workspace.getFact(variableName);
        const actualValue =
          variableValue ?? (factValue !== undefined ? factValue.toString() : undefined);

        // If variable doesn't exist, condition is false
        if (actualValue === undefined) {
          return false;
        }

        // Compare values (both should be strings for comparison)
        if (actualValue !== expectedValue) {
          return false;
        }
      }
      return true;
    }

    // If var is a string, it's an existence check: { var: 'name' }
    const variableName = condition.var;
    return this.workspace.hasVariable(variableName) || this.workspace.hasFact(variableName);
  }

  /**
   * Check if a file or directory exists
   */
  private evaluateFileExists(condition: { file: string }): boolean {
    try {
      const filePath = condition.file.trim();
      const absolutePath = resolve(process.cwd(), filePath);
      return existsSync(absolutePath);
    } catch {
      return false;
    }
  }

  /**
   * Check if user made a specific choice
   */
  private evaluateChoice(condition: { choice: string }): boolean {
    return this.workspace.hasChoice(condition.choice);
  }

  /**
   * Check if all conditions are true (AND logic)
   */
  private evaluateAll(condition: { all: Condition[] }): boolean {
    return condition.all.every((subCondition) => this.evaluate(subCondition));
  }

  /**
   * Check if any condition is true (OR logic)
   */
  private evaluateAny(condition: { any: Condition[] }): boolean {
    return condition.any.some((subCondition) => this.evaluate(subCondition));
  }

  /**
   * Negate a condition (NOT logic)
   */
  private evaluateNot(condition: { not: Condition }): boolean {
    return !this.evaluate(condition.not);
  }
}
