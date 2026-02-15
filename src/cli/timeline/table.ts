import { uiText as chalk } from '@ui/primitives';
import {
  generateTimelineBar,
  getDurationColor,
  padLeft,
  padRight,
  truncateWithWidth,
  validateRowWidth,
} from './table-utils';
import type { TimelineStep } from './types';

/**
 * Generate timeline table
 */
export function generateTimelineTable(
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
    const actualWidth = row
      // eslint-disable-next-line no-control-regex
      .replace(/\u001b\[[0-9;]*m/g, '')
      .split('')
      .reduce((sum, ch) => sum + (ch.charCodeAt(0) > 255 ? 2 : 1), 0);

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

  // Top border row - matches footer structure
  // Top: "┌─" (2) + "─"×stepColumnWidth + "─┬─" (3) + "─"×startColumnWidth + "─┬─" (3) + "─"×durationColumnWidth + "─┬─" (3) + "─"×barWidth + "─┐" (2)
  const topStepDashes = '─'.repeat(stepColumnWidth);
  const topStartDashes = '─'.repeat(startColumnWidth);
  const topDurationDashes = '─'.repeat(durationColumnWidth);
  const topBarDashes = '─'.repeat(barWidth);
  let topRow = `┌─${topStepDashes}─┬─${topStartDashes}─┬─${topDurationDashes}─┬─${topBarDashes}─┐`;
  topRow = ensureExactWidth(topRow, exactRowWidth, true);
  lines.push(topRow);

  // Header - use plain text first, then apply chalk
  const stepHeader = padRight('Step / Task', stepColumnWidth);
  const startHeader = padLeft('Start', startColumnWidth);
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
      false, // isParallelBranch
      overlapIndex,
      sameStartSteps.length,
      step.isParallel // isParallelStep
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
    // Ensure parallel branches are always displayed if step is marked as parallel
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
          true, // isParallelBranch
          0, // overlapIndex
          1, // overlapCount
          false // isParallelStep
        );
        // Rule: First task: "│  ⎧ ", Middle tasks: "│  ├ ", Last task: "│  ⎩ "
        // Use connecting lines to show branches are connected
        const connector =
          i === 0 ? '│  ⎧ ' : i === step.parallelBranches.length - 1 ? '│  ⎩ ' : '│  ├ '; // Middle tasks: use ├ to show connection
        const branchNameWidth = stepColumnWidth - 3; // Leave space for connector (4 chars: "│  ⎧ ", "│  ⎩ ", "│  ├ ")
        const branchName = padRight(chalk.blue(branch.name), branchNameWidth);
        const branchDurationColor = getDurationColor(branch.duration, slowestDuration);
        const coloredBranchDuration = branchDurationColor(`${branchDurationSec}s`);

        // For parallel branches, connector already includes │, so don't add another one
        let branchRow = `${connector}${branchName} │ ${padLeft(`${branchStartSec}s`, startColumnWidth)} │ ${padLeft(coloredBranchDuration, durationColumnWidth)} │ ${branchTimelineBar} │`;

        // Ensure exact width
        branchRow = ensureExactWidth(branchRow, exactRowWidth);

        // Validate branch row width
        if (!validateRowWidth(branchRow, maxAllowedWidth)) {
          // Truncate branch name if necessary
          const truncatedBranchName = truncateWithWidth(
            chalk.blue(branch.name),
            branchNameWidth - 3
          );
          branchRow = `${connector}${padRight(truncatedBranchName, branchNameWidth)} │ ${padLeft(`${branchStartSec}s`, startColumnWidth)} │ ${padLeft(coloredBranchDuration, durationColumnWidth)} │ ${branchTimelineBar} │`;
          branchRow = ensureExactWidth(branchRow, exactRowWidth);
        }
        lines.push(branchRow);
      }
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
