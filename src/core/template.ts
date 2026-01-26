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
    return workspace.getVariable(variableName) || defaultValue;
  }

  // Second, check facts
  if (workspace.hasFact(variableName)) {
    const factValue = workspace.getFact(variableName);
    return typeof factValue === 'string' ? factValue : String(factValue);
  }

  // Third, check choices
  if (workspace.hasChoice(variableName)) {
    return workspace.getChoice(variableName) || defaultValue;
  }

  // If not found, return the original template text
  return defaultValue;
}

/**
 * Substitute {{variable}} template variables in string with actual values
 * Example: "Hello {{name}}" becomes "Hello John" if name variable is "John"
 */
export function substituteVariables(template: string, workspace: Workspace): string {
  const variablePattern = /\{\{(\w+)\}\}/g;

  return template.replace(variablePattern, (originalMatch, variableName) => {
    return findVariableValue(variableName, workspace, originalMatch);
  });
}
