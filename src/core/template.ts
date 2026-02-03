/**
 * Template Variable Substitution
 * Replaces {{variable}} with actual values from workspace
 */

import type { Workspace } from './workspace';

/**
 * Find variable value from workspace
 * Checks variables, facts, and choices in that order
 */
function findVariableValue(
  variableName: string,
  workspace: Workspace,
  defaultValue: string
): string {
  // First, check variables
  if (workspace.hasVariable(variableName)) {
    const value = workspace.getVariable(variableName);
    // Return empty string if value is explicitly set to empty, otherwise use default
    return value !== null && value !== undefined ? value : defaultValue;
  }

  // Second, check facts
  if (workspace.hasFact(variableName)) {
    const factValue = workspace.getFact(variableName);
    return typeof factValue === 'string' ? factValue : String(factValue);
  }

  // Third, check choices
  if (workspace.hasChoice(variableName)) {
    const value = workspace.getChoice(variableName);
    // Return empty string if value is explicitly set to empty, otherwise use default
    return value !== null && value !== undefined ? value : defaultValue;
  }

  // If not found, return the original template text
  return defaultValue;
}

/**
 * Substitute {{variable}} template variables in string with actual values
 * Example: "Hello {{name}}" becomes "Hello John" if name variable is "John"
 * Supports optional whitespace: {{var}}, {{ var }}, {{  var  }} all work
 */
export function substituteVariables(template: string, workspace: Workspace): string {
  // Allow optional whitespace around variable name: {{var}}, {{ var }}, etc.
  const variablePattern = /\{\{\s*(\w+)\s*\}\}/g;

  return template.replace(variablePattern, (originalMatch, variableName) => {
    return findVariableValue(variableName, workspace, originalMatch);
  });
}
