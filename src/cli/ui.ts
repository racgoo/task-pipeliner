/**
 * UI Utilities
 * Common UI components for CLI output (boxes, dividers, etc.)
 */

import boxen from 'boxen';
import chalk from 'chalk';

export interface BoxOptions {
  title?: string;
  borderColor?: 'cyan' | 'green' | 'yellow' | 'red' | 'blue';
  isNested?: boolean;
}

/**
 * Create step header box
 */
export function createStepHeaderBox(
  content: string,
  lineNumber?: number,
  fileName?: string,
  options: BoxOptions = {}
): string {
  const { borderColor = 'cyan', isNested = false } = options;
  
  // Create title with line number and file name
  let title: string | undefined;
  if (lineNumber !== undefined) {
    if (fileName) {
      title = `line ${lineNumber} in ${fileName}`;
    } else {
      title = `line ${lineNumber}`;
    }
  }
  
  // Add indentation when nested
  const displayContent = isNested ? `│ ${content}` : `> ${content}`;
  
  return boxen(
    displayContent,
    {
      title: title,
      borderStyle: 'round',
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      margin: { top: 0, bottom: 0 },
      borderColor: borderColor,
    }
  );
}

/**
 * Create step completion message (no box, just colored text)
 */
export function createStepFooterMessage(
  success: boolean,
  _isNested: boolean = false
): string {
  const statusText = success ? '✓ Completed' : '✗ Failed';
  return success ? chalk.green(statusText) : chalk.red(statusText);
}

/**
 * Create error box
 */
export function createErrorBox(
  error: string,
): string {
  return boxen(
    `✗ ${error}`,
    {
      borderStyle: 'round',
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      margin: { top: 0, bottom: 0 },
      borderColor: 'red',
    }
  );
}

/**
 * Create parallel execution header box
 */
export function createParallelHeaderBox(branchCount: number): string {
  return boxen(
    `> Starting parallel execution (${branchCount} branches)`,
    {
      borderStyle: 'round',
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      margin: { top: 0, bottom: 0 },
      borderColor: 'yellow',
    }
  );
}

/**
 * Create parallel execution footer message (no box, just colored text)
 */
export function createParallelFooterMessage(allSucceeded: boolean): string {
  const statusText = allSucceeded 
    ? '✓ All parallel branches completed'
    : '✗ Some parallel branches failed';
  return allSucceeded ? chalk.green(statusText) : chalk.red(statusText);
}

/**
 * Step divider line (deprecated - no longer used)
 * @deprecated Dividers are no longer displayed
 */
export function createDivider(): string {
  return '';
}

/**
 * Format nested output line
 */
export function formatNestedLine(line: string, isNested: boolean = false): string {
  const prefix = isNested ? '| │ ' : '│ ';
  return `${prefix}${line}`;
}

