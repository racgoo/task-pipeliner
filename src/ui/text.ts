import { uiTone } from './primitives';

/**
 * Create step completion message (no box, just colored text)
 */
export function createStepFooterMessage(
  success: boolean,
  _isNested: boolean = false,
  duration?: number
): string {
  const statusText = success ? '✓ Completed' : '✗ Failed';
  const statusColor = success ? uiTone.success(statusText) : uiTone.error(statusText);

  if (duration !== undefined) {
    const durationStr = formatDuration(duration);
    return `${statusColor} ${uiTone.muted(`(${durationStr})`)}`;
  }

  return statusColor;
}

/**
 * Create parallel execution footer message (no box, just colored text)
 */
export function createParallelFooterMessage(allSucceeded: boolean): string {
  const statusText = allSucceeded
    ? '✓ All parallel branches completed'
    : '✗ Some parallel branches failed';
  return allSucceeded ? uiTone.success(statusText) : uiTone.error(statusText);
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

/**
 * Format duration in milliseconds to seconds string with 3 decimal places
 */
export function formatDuration(durationMs: number): string {
  return `${(durationMs / 1000).toFixed(3)}s`;
}
