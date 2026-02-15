import { uiText as chalk } from '@ui/primitives';
import stringWidth from 'string-width';

/**
 * Validate row width to ensure it doesn't exceed terminal width
 */
export function validateRowWidth(row: string, maxWidth: number): boolean {
  const actualWidth = getVisualWidth(row);
  return actualWidth <= maxWidth;
}

/**
 * Get color for duration based on how slow it is
 */
export function getDurationColor(
  duration: number,
  slowestDuration: number
): (text: string) => string {
  if (duration === 0) {
    return chalk.gray;
  }
  const ratio = duration / slowestDuration;
  if (ratio >= 0.8) {
    return chalk.red; // Very slow
  } else if (ratio >= 0.5) {
    return chalk.yellow; // Medium
  } else {
    return chalk.green; // Fast
  }
}

/**
 * Generate timeline bar for a step
 */
export function generateTimelineBar(
  startTime: number,
  duration: number,
  totalDuration: number,
  barWidth: number,
  stepDuration: number,
  slowestDuration: number,
  isParallelBranch: boolean = false,
  overlapIndex: number = 0,
  overlapCount: number = 1,
  isParallelStep: boolean = false
): string {
  const startRatio = startTime / totalDuration;
  const endTime = startTime + duration;
  const endRatio = endTime / totalDuration;

  // Calculate positions more precisely to avoid overlaps
  // Use Math.round for better accuracy, but ensure minimum 1 position for visibility
  let startPos = Math.round(startRatio * barWidth);
  let endPos = Math.round(endRatio * barWidth);

  // If multiple steps start at the same time, add small offset to avoid exact overlap
  // This ensures each step is visually distinct even when they start simultaneously
  if (overlapCount > 1 && duration === 0) {
    // For 0-duration steps at the same time, add tiny offset based on index
    // This makes them visually distinct without breaking the timeline accuracy
    const offset = overlapIndex * 0.0001; // Very small offset, just for visual distinction
    startPos = Math.round((startRatio + offset) * barWidth);
    endPos = startPos + 1;
  } else {
    // Ensure minimum 1 position width for visibility, even for 0 duration
    if (endPos <= startPos) {
      endPos = startPos + 1;
    }
  }

  // Ensure positions are within bounds
  startPos = Math.max(0, Math.min(startPos, barWidth - 1));
  endPos = Math.max(startPos + 1, Math.min(endPos, barWidth));

  // Determine bar color
  let barColor: (text: string) => string;
  if (isParallelBranch) {
    // Parallel branches - use cyan color for better visibility
    barColor = chalk.cyan;
  } else if (isParallelStep) {
    // Parallel step itself - use blue color
    barColor = chalk.blue;
  } else if (stepDuration === 0) {
    barColor = chalk.gray;
  } else {
    const ratio = stepDuration / slowestDuration;
    if (ratio >= 0.8) {
      barColor = chalk.red; // Very slow
    } else if (ratio >= 0.5) {
      barColor = chalk.yellow; // Medium
    } else {
      barColor = chalk.green; // Fast
    }
  }

  // If task completed (reached the end), ensure it ends with █
  // This prevents ending with ░ which looks like the task didn't complete
  const isCompleted = endRatio >= 0.99 || endPos >= barWidth;
  const actualEndPos = isCompleted ? barWidth : endPos;

  let bar = '';
  // Add empty space before bar
  for (let i = 0; i < startPos; i++) {
    bar += chalk.gray('░');
  }
  // Add filled bar with color
  const actualBarLength = actualEndPos - startPos;
  const filledBar = '█'.repeat(actualBarLength);
  bar += barColor(filledBar);
  // Fill remaining space
  const remaining = barWidth - actualEndPos;
  for (let i = 0; i < remaining; i++) {
    bar += chalk.gray('░');
  }

  return bar;
}

/**
 * Get the visual width of a string (ignoring ANSI codes)
 */
function getVisualWidth(str: string): number {
  return stringWidth(str);
}

/**
 * Truncate string to specified width, preserving ANSI codes and handling full-width characters
 * Uses string-width to correctly handle Korean and other full-width characters
 * Adds "..." at the end when truncated
 */
export function truncateWithWidth(str: string, maxWidth: number): string {
  const visualWidth = getVisualWidth(str);
  if (visualWidth <= maxWidth) {
    return str;
  }

  // Reserve 3 characters for "..."
  const ellipsisWidth = 2;
  const availableWidth = maxWidth - ellipsisWidth;
  if (availableWidth < 1) {
    // If maxWidth is too small, just return "..."
    return '..';
  }

  // Strip ANSI codes to work with plain text
  // eslint-disable-next-line no-control-regex
  const ansiRegex = /\u001b\[[0-9;]*m/g;
  const ansiCodes: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = ansiRegex.exec(str)) !== null) {
    ansiCodes.push(match[0]);
  }

  // Remove ANSI codes for width calculation
  const plainText = str.replace(ansiRegex, '');

  // Truncate character by character until we reach the available width
  let result = '';
  let currentWidth = 0;
  for (let i = 0; i < plainText.length; i++) {
    const char = plainText[i];
    const charWidth = stringWidth(char);
    if (currentWidth + charWidth > availableWidth) {
      break;
    }
    result += char;
    currentWidth += charWidth;
  }

  // Add ellipsis
  result += '..';

  // Reconstruct with ANSI codes if they existed
  if (ansiCodes.length > 0 && result.length > 0) {
    // Find where ANSI codes should be placed
    // Simple approach: add first ANSI code at start, last at end
    return ansiCodes[0] + result + (ansiCodes[ansiCodes.length - 1] ?? '');
  }

  return result;
}

/**
 * Pad string to the right (handles ANSI codes and full-width characters correctly)
 */
export function padRight(str: string, width: number): string {
  const visualWidth = getVisualWidth(str);
  if (visualWidth >= width) {
    // Truncate if needed, preserving ANSI codes and handling full-width characters
    return truncateWithWidth(str, width);
  }
  return str + ' '.repeat(width - visualWidth);
}

/**
 * Pad string to the left (handles ANSI codes and full-width characters correctly)
 */
export function padLeft(str: string, width: number): string {
  const visualWidth = getVisualWidth(str);
  if (visualWidth >= width) {
    // Truncate if needed, preserving ANSI codes and handling full-width characters
    return truncateWithWidth(str, width);
  }
  return ' '.repeat(width - visualWidth) + str;
}
