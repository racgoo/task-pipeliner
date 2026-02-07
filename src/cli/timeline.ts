/**
 * Timeline UI for workflow execution
 * Displays a timeline table showing step execution times, start times, and visual timeline bars
 */

import boxen from 'boxen';
import chalk from 'chalk';
import stringWidth from 'string-width';
import type { History, Record } from '../types/workflow';

interface TimelineStep {
  stepNumber: number;
  name: string;
  startTime: number; // milliseconds from initialTimestamp
  duration: number; // milliseconds
  isParallel: boolean;
  parallelBranches?: TimelineBranch[];
}

interface TimelineBranch {
  name: string;
  startTime: number;
  duration: number;
}

/**
 * Generate timeline display for workflow execution
 */
export function generateTimeline(history: History): string {
  if (history.records.length === 0) {
    return '';
  }

  // Group records by step index (for parallel execution detection)
  const stepGroups = groupRecordsByStepIndex(history.records);

  // Calculate total execution time
  // For sequential steps, sum all durations
  // For parallel steps, only count the longest duration in each group
  let totalDuration = 0;
  for (const group of stepGroups) {
    if (group.length > 1) {
      // Parallel group: use longest duration
      totalDuration += Math.max(...group.map((r) => r.duration));
    } else {
      // Sequential step
      totalDuration += group[0].duration;
    }
  }
  const totalDurationSec = (totalDuration / 1000).toFixed(1);

  // Find slowest step
  const slowestRecord = history.records.reduce((slowest, record) =>
    record.duration > slowest.duration ? record : slowest
  );
  const slowestStepNumber = history.records.indexOf(slowestRecord) + 1;
  const slowestDurationSec = (slowestRecord.duration / 1000).toFixed(1);

  // Build timeline steps
  const timelineSteps: TimelineStep[] = [];
  let currentTime = 0; // milliseconds from initialTimestamp

  for (let i = 0; i < stepGroups.length; i++) {
    const group = stepGroups[i];
    // Check if this is a parallel group:
    // Parallel branches have branchIndex !== undefined and stepIndex >= 1000
    // A parallel group must have at least 2 branches (group.length > 1)
    const isParallel =
      group.length > 1 &&
      group.some((r) => r.context.branchIndex !== undefined && r.context.stepIndex >= 1000);

    if (isParallel && group.length > 0) {
      // Use all records in the group (they are all parallel branches)
      const recordsToUse = group;

      // Parallel execution group
      // All branches start at the same time
      const parallelBranches: TimelineBranch[] = recordsToUse.map((record) => ({
        name: getStepShortName(record),
        startTime: currentTime,
        duration: record.duration,
      }));

      // Parallel group duration is the longest branch duration
      const groupDuration = Math.max(...recordsToUse.map((r) => r.duration));

      timelineSteps.push({
        stepNumber: i + 1,
        name: `Parallel`,
        startTime: currentTime,
        duration: groupDuration,
        isParallel: true,
        parallelBranches,
      });

      currentTime += groupDuration;
    } else {
      // Sequential step (single record, no parallel branches)
      const record = group[0];
      const stepName = getStepShortName(record);
      // Ensure step name is not empty
      const finalStepName = stepName || 'Unknown';
      timelineSteps.push({
        stepNumber: i + 1,
        name: finalStepName,
        startTime: currentTime,
        duration: record.duration,
        isParallel: false,
      });

      currentTime += record.duration;
    }
  }

  // Generate table
  const table = generateTimelineTable(timelineSteps, totalDuration, slowestRecord.duration);

  // Create header with summary
  const header = `${chalk.bold('Workflow Summary')}\n${chalk.cyan(`Workflow finished in ${totalDurationSec}s`)}\n${chalk.yellow(`Slowest step: Step ${slowestStepNumber} (${slowestDurationSec}s)`)}`;

  // Wrap everything in a box
  const content = `${header}\n\n${table}`;

  return `\n${boxen(content, {
    borderStyle: 'round',
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
    borderColor: 'cyan',
  })}`;
}

/**
 * Group records by step index to detect parallel execution
 * PARALLEL_STEP_INDEX_MULTIPLIER = 1000
 * Parallel branches have stepIndex = baseStepIndex * 1000 + branchIndex
 */
function groupRecordsByStepIndex(records: Record[]): Record[][] {
  const groups: Record[][] = [];
  const stepIndexMap = new Map<number, Record[]>();
  const PARALLEL_STEP_INDEX_MULTIPLIER = 1000;

  // Group all records by base step index
  // Parallel branches have stepIndex >= 1000, so divide by 1000 to get base step index
  for (const record of records) {
    let baseStepIndex: number;

    // Check if this is a parallel branch
    if (
      record.context.branchIndex !== undefined &&
      record.context.stepIndex >= PARALLEL_STEP_INDEX_MULTIPLIER
    ) {
      // Parallel branch: stepIndex = baseStepIndex * 1000 + branchIndex
      baseStepIndex = Math.floor(record.context.stepIndex / PARALLEL_STEP_INDEX_MULTIPLIER);
    } else {
      // Sequential step: stepIndex is the base step index
      baseStepIndex = record.context.stepIndex;
    }

    if (!stepIndexMap.has(baseStepIndex)) {
      stepIndexMap.set(baseStepIndex, []);
    }
    const group = stepIndexMap.get(baseStepIndex);
    if (group) {
      group.push(record);
    }
  }

  // Sort by step index and convert to array
  const sortedIndices = Array.from(stepIndexMap.keys()).sort((a, b) => a - b);
  for (const stepIndex of sortedIndices) {
    const group = stepIndexMap.get(stepIndex);
    if (group) {
      // Check if this group contains parallel branches
      // Parallel branches have branchIndex !== undefined and stepIndex >= 1000
      const parallelBranches = group.filter(
        (r) =>
          r.context.branchIndex !== undefined &&
          r.context.stepIndex >= PARALLEL_STEP_INDEX_MULTIPLIER
      );

      if (parallelBranches.length > 0) {
        // This is a parallel group
        // Sort by branchIndex to maintain order
        parallelBranches.sort((a, b) => {
          const aBranch = a.context.branchIndex ?? -1;
          const bBranch = b.context.branchIndex ?? -1;
          return aBranch - bBranch;
        });
        groups.push(parallelBranches);

        // If there are sequential steps with the same baseStepIndex (shouldn't happen, but handle it)
        const sequentialRecords = group.filter(
          (r) =>
            r.context.branchIndex === undefined ||
            r.context.stepIndex < PARALLEL_STEP_INDEX_MULTIPLIER
        );
        if (sequentialRecords.length > 0) {
          sequentialRecords.sort((a, b) => a.context.stepIndex - b.context.stepIndex);
          groups.push(sequentialRecords);
        }
      } else {
        // Sequential step - sort by stepIndex (should be only one, but just in case)
        group.sort((a, b) => a.context.stepIndex - b.context.stepIndex);
        groups.push(group);
      }
    }
  }

  return groups;
}

/**
 * Get short name for a step (for timeline display)
 * Returns name that fits in 28 character column (including "Step X: " prefix)
 * Step prefix is typically 8-10 characters, so name can be up to 18-20 characters
 */
function getStepShortName(record: Record): string {
  const step = record.step;
  const maxNameLength = 28; // Leave room for "Step X: " prefix (8-10 chars), so up to 20 chars for name

  if ('run' in step) {
    const cmd = record.resolvedCommand ?? step.run;
    // Truncate long commands
    if (cmd.length > maxNameLength) {
      return `${cmd.substring(0, maxNameLength - 2)}..`;
    }
    return cmd;
  } else if ('choose' in step) {
    const msg = step.choose.message;
    if (msg.length > maxNameLength) {
      return `${msg.substring(0, maxNameLength - 2)}..`;
    }
    return msg;
  } else if ('prompt' in step) {
    const msg = step.prompt.message;
    if (msg.length > maxNameLength) {
      return `${msg.substring(0, maxNameLength - 2)}..`;
    }
    return msg;
  } else if ('parallel' in step) {
    return `Parallel`;
  } else if ('fail' in step) {
    const msg = step.fail.message;
    if (msg.length > maxNameLength) {
      return `${msg.substring(0, maxNameLength - 2)}..`;
    }
    return msg;
  }

  return 'Unknown';
}

/**
 * Validate row width to ensure it doesn't exceed terminal width
 */
function validateRowWidth(row: string, maxWidth: number): boolean {
  const actualWidth = getVisualWidth(row);
  return actualWidth <= maxWidth;
}

/**
 * Generate timeline table
 */
function generateTimelineTable(
  steps: TimelineStep[],
  totalDuration: number,
  slowestDuration: number
): string {
  // Calculate available width considering boxen padding and borders
  // boxen with round border and cyan color:
  // - Left border: "╭" (1 char) + ANSI codes (~10-12 chars) = ~12 chars
  // - Left padding: 1 char
  // - Right padding: 1 char
  // - Right border: "╮" (1 char) + ANSI codes (~10-12 chars) = ~12 chars
  // - Content width calculation needs to account for all of this
  // Each table row: "│ " (2) + columns + separators + " │" (2)
  const terminalWidth = process.stdout.columns || 80;
  // Extremely conservative boxenOverhead calculation
  // Round borders with ANSI: left (~12) + right (~12) = ~24 chars
  // Padding: left (1) + right (1) = 2 chars
  // Additional safety margin for edge cases: 12-14 chars
  // Total: ~38-40 chars - use 40 to be absolutely safe
  const boxenOverhead = 36; // Extremely conservative to ensure table never exceeds box
  const tableRowOverhead = 4; // table left border "│ " (2) + right border " │" (2)

  // Fixed column widths (content only, not including separators)
  const stepColumnWidth = 36; // "Step / Task" - balanced width to minimize padding while showing content
  const startColumnWidth = 8; // "Start"
  const durationColumnWidth = 8; // "Duration"
  // Separators: " │ " appears 3 times between 4 columns = 9 chars
  const separatorsTotalWidth = 9; // 3 separators × 3 chars = 9 (" │ " × 3)

  // Calculate timeline bar width
  // Total row width = tableRowOverhead + fixedColumnsWidth + barWidth
  // This must fit in: terminalWidth - boxenOverhead
  const fixedColumnsWidth =
    stepColumnWidth + startColumnWidth + durationColumnWidth + separatorsTotalWidth;
  const maxRowWidth = terminalWidth - boxenOverhead;
  const timelineColumnWidth = maxRowWidth - tableRowOverhead - fixedColumnsWidth;
  const minBarWidth = 40; // Minimum width for better visibility
  // No hard max limit - use available space, but keep small safety margin for ANSI codes
  const safetyMargin = 5; // Small margin for ANSI codes in timeline bar
  const barWidth = Math.max(minBarWidth, Math.max(0, timelineColumnWidth - safetyMargin));

  const lines: string[] = [];
  // Calculate exact row width that all rows must match
  // Row structure: "│ " (2) + stepColumn + " │ " (3) + startColumn + " │ " (3) + durationColumn + " │ " (3) + barWidth + " │" (2)
  // Total: 2 + stepColumnWidth + 3 + startColumnWidth + 3 + durationColumnWidth + 3 + barWidth + 2
  // = stepColumnWidth + startColumnWidth + durationColumnWidth + barWidth + 13
  const exactRowWidth =
    2 + // "│ "
    stepColumnWidth +
    3 + // " │ "
    startColumnWidth +
    3 + // " │ "
    durationColumnWidth +
    3 + // " │ "
    barWidth +
    2; // " │"
  // Use extremely conservative width for validation
  // This ensures rows never exceed the boxen boundaries
  // Additional safety margin of 8 chars to account for any edge cases
  const maxAllowedWidth = terminalWidth - boxenOverhead - 8; // Extra 8 chars safety margin

  // Helper function to ensure row has exact width
  // For separator and footer rows, we need to pad the dashes, not add spaces around connectors
  const ensureExactWidth = (
    row: string,
    targetWidth: number,
    isSeparatorOrFooter = false
  ): string => {
    const actualWidth = getVisualWidth(row);
    if (actualWidth === targetWidth) {
      return row;
    }
    if (actualWidth > targetWidth) {
      // Row is too wide, need to truncate
      // This shouldn't happen if padding is correct, but handle it
      return truncateWithWidth(row, targetWidth);
    }
    // Row is too narrow, need to pad
    const paddingNeeded = targetWidth - actualWidth;

    if (isSeparatorOrFooter) {
      // For separator/footer, pad the dashes in each section, not around connectors
      // Find all dash sections and pad the last one
      // Structure: "├" + dashes + "┼" + dashes + "┼" + dashes + "┼" + dashes + "┤"
      // We'll pad the last dash section
      const lastDashSectionEnd = row.lastIndexOf('┤');
      const lastDashSectionStart = row.lastIndexOf('┼', lastDashSectionEnd - 1);
      if (lastDashSectionStart > 0 && lastDashSectionEnd > lastDashSectionStart) {
        const beforeLastDash = row.slice(0, lastDashSectionStart + 1);
        const lastDashSection = row.slice(lastDashSectionStart + 1, lastDashSectionEnd);
        const afterLastDash = row.slice(lastDashSectionEnd);
        return beforeLastDash + lastDashSection + '─'.repeat(paddingNeeded) + afterLastDash;
      }
      // Fallback: pad at the end before final character
      return row.slice(0, -1) + '─'.repeat(paddingNeeded) + row.slice(-1);
    }

    // For data rows, pad with spaces before final │
    const lastPipeIndex = row.lastIndexOf('│');
    if (lastPipeIndex > 0) {
      return row.slice(0, lastPipeIndex) + ' '.repeat(paddingNeeded) + row.slice(lastPipeIndex);
    }
    return row + ' '.repeat(paddingNeeded);
  };

  // Header - use plain text first, then apply chalk
  const stepHeader = padRight('Step / Task', stepColumnWidth);
  const startHeader = padRight('Start', startColumnWidth);
  const durationHeader = padRight('Duration', durationColumnWidth);
  const timelineHeader = padRight('Timeline', barWidth);
  let headerRow = `│ ${chalk.bold(stepHeader)} │ ${chalk.bold(startHeader)} │ ${chalk.bold(durationHeader)} │ ${chalk.bold(timelineHeader)} │`;
  headerRow = ensureExactWidth(headerRow, exactRowWidth);
  lines.push(headerRow);

  // Separator row must match data row structure exactly to align │ positions
  // Data row: "│ " (2) + content(stepColumnWidth) + " │ " (3) + content(startColumnWidth) + " │ " (3) + content(durationColumnWidth) + " │ " (3) + content(barWidth) + " │" (2)
  // Separator: "├─" (2) + "─"×stepColumnWidth + "─┼─" (3) + "─"×startColumnWidth + "─┼─" (3) + "─"×durationColumnWidth + "─┼─" (3) + "─"×barWidth + "─┤" (2)
  // This matches the │ positions exactly
  const separatorStepDashes = '─'.repeat(stepColumnWidth);
  const separatorStartDashes = '─'.repeat(startColumnWidth);
  const separatorDurationDashes = '─'.repeat(durationColumnWidth);
  const separatorBarDashes = '─'.repeat(barWidth);
  let separatorRow = `├─${separatorStepDashes}─┼─${separatorStartDashes}─┼─${separatorDurationDashes}─┼─${separatorBarDashes}─┤`;
  separatorRow = ensureExactWidth(separatorRow, exactRowWidth, true);
  lines.push(separatorRow);

  // Track steps that start at the same time to avoid overlaps
  const startTimeMap = new Map<number, number[]>(); // startTime -> array of step indices
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const roundedStartTime = Math.round(step.startTime);
    if (!startTimeMap.has(roundedStartTime)) {
      startTimeMap.set(roundedStartTime, []);
    }
    startTimeMap.get(roundedStartTime)?.push(i);
  }

  for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
    const step = steps[stepIndex];
    const startSec = (step.startTime / 1000).toFixed(1);
    const durationSec = (step.duration / 1000).toFixed(1);
    const stepName = `${chalk.cyan(`Step ${step.stepNumber}`)}: ${step.name}`;

    // Color duration based on how slow it is
    const durationColor = getDurationColor(step.duration, slowestDuration);
    const coloredDuration = durationColor(`${durationSec}s`);

    // Check if there are other steps starting at the same time
    const roundedStartTime = Math.round(step.startTime);
    const sameStartSteps = startTimeMap.get(roundedStartTime) ?? [];
    const overlapIndex = sameStartSteps.indexOf(stepIndex);

    // Main step row
    const timelineBar = generateTimelineBar(
      step.startTime,
      step.duration,
      totalDuration,
      barWidth,
      step.duration,
      slowestDuration,
      false,
      overlapIndex,
      sameStartSteps.length
    );
    let mainRow = `│ ${padRight(stepName, stepColumnWidth)} │ ${padLeft(`${startSec}s`, startColumnWidth)} │ ${padLeft(coloredDuration, durationColumnWidth)} │ ${timelineBar} │`;

    // Ensure exact width and validate
    mainRow = ensureExactWidth(mainRow, exactRowWidth);

    // Validate against max allowed width
    if (!validateRowWidth(mainRow, maxAllowedWidth)) {
      // If row is too wide, truncate step name further
      const truncatedStepName = truncateWithWidth(stepName, stepColumnWidth);
      mainRow = `│ ${padRight(truncatedStepName, stepColumnWidth)} │ ${padLeft(`${startSec}s`, startColumnWidth)} │ ${padLeft(coloredDuration, durationColumnWidth)} │ ${timelineBar} │`;
      mainRow = ensureExactWidth(mainRow, exactRowWidth);
    }

    lines.push(mainRow);

    // Parallel branches - render tasks below the step
    // Rule: First task uses "  ⎧ ", Last task uses "  ⎩ "
    if (step.isParallel && step.parallelBranches && step.parallelBranches.length > 0) {
      for (let i = 0; i < step.parallelBranches.length; i++) {
        const branch = step.parallelBranches[i];
        const branchStartSec = (branch.startTime / 1000).toFixed(1);
        const branchDurationSec = (branch.duration / 1000).toFixed(1);
        const branchTimelineBar = generateTimelineBar(
          branch.startTime,
          branch.duration,
          totalDuration,
          barWidth,
          branch.duration,
          slowestDuration,
          true // isParallelBranch
        );
        // Rule: First task: "  ⎧ ", Last task: "  ⎩ "
        const connector =
          i === 0 ? '  ⎧ ' : i === step.parallelBranches.length - 1 ? '  ⎩ ' : '    '; // Middle tasks: just spaces (no connector)
        const branchNameWidth = stepColumnWidth - 4; // Leave space for "  ⎧ " or "  ⎩ " (4 chars)
        const branchName = padRight(chalk.blue(branch.name), branchNameWidth);
        const branchDurationColor = getDurationColor(branch.duration, slowestDuration);
        const coloredBranchDuration = branchDurationColor(`${branchDurationSec}s`);

        let branchRow = `│${connector}${branchName} │ ${padLeft(`${branchStartSec}s`, startColumnWidth)} │ ${padLeft(coloredBranchDuration, durationColumnWidth)} │ ${branchTimelineBar} │`;

        // Ensure exact width
        branchRow = ensureExactWidth(branchRow, exactRowWidth);

        // Validate branch row width
        if (!validateRowWidth(branchRow, maxAllowedWidth)) {
          // Truncate branch name if necessary
          const truncatedBranchName = truncateWithWidth(
            chalk.blue(branch.name),
            branchNameWidth - 3
          );
          branchRow = `│${connector}${padRight(truncatedBranchName, branchNameWidth)} │ ${padLeft(`${branchStartSec}s`, startColumnWidth)} │ ${padLeft(coloredBranchDuration, durationColumnWidth)} │ ${branchTimelineBar} │`;
          branchRow = ensureExactWidth(branchRow, exactRowWidth);
        }
        lines.push(branchRow);
      }

      // Empty row after parallel group
      const emptyBar = ' '.repeat(barWidth);
      let emptyRow = `│ ${' '.repeat(stepColumnWidth)} │ ${' '.repeat(startColumnWidth)} │ ${' '.repeat(durationColumnWidth)} │ ${emptyBar} │`;
      emptyRow = ensureExactWidth(emptyRow, exactRowWidth);
      lines.push(emptyRow);
    }
  }

  // Footer must match data row structure exactly to align │ positions
  // Data row: "│ " (2) + content(stepColumnWidth) + " │ " (3) + content(startColumnWidth) + " │ " (3) + content(durationColumnWidth) + " │ " (3) + content(barWidth) + " │" (2)
  // Footer: "└─" (2) + "─"×stepColumnWidth + "─┴─" (3) + "─"×startColumnWidth + "─┴─" (3) + "─"×durationColumnWidth + "─┴─" (3) + "─"×barWidth + "─┘" (2)
  // This matches the │ positions exactly
  const footerStepDashes = '─'.repeat(stepColumnWidth);
  const footerStartDashes = '─'.repeat(startColumnWidth);
  const footerDurationDashes = '─'.repeat(durationColumnWidth);
  const footerBarDashes = '─'.repeat(barWidth);
  let footerRow = `└─${footerStepDashes}─┴─${footerStartDashes}─┴─${footerDurationDashes}─┴─${footerBarDashes}─┘`;
  footerRow = ensureExactWidth(footerRow, exactRowWidth, true);
  lines.push(footerRow);

  return lines.join('\n');
}

/**
 * Get color for duration based on how slow it is
 */
function getDurationColor(duration: number, slowestDuration: number): (text: string) => string {
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
function generateTimelineBar(
  startTime: number,
  duration: number,
  totalDuration: number,
  barWidth: number,
  stepDuration: number,
  slowestDuration: number,
  isParallelBranch: boolean = false,
  overlapIndex: number = 0,
  overlapCount: number = 1
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
function truncateWithWidth(str: string, maxWidth: number): string {
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
function padRight(str: string, width: number): string {
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
function padLeft(str: string, width: number): string {
  const visualWidth = getVisualWidth(str);
  if (visualWidth >= width) {
    // Truncate if needed, preserving ANSI codes and handling full-width characters
    return truncateWithWidth(str, width);
  }
  return ' '.repeat(width - visualWidth) + str;
}
