/**
 * Timeline UI for workflow execution
 * Displays a timeline table showing step execution times, start times, and visual timeline bars
 */

import type { History } from '@tp-types/workflow';
import { uiBox as boxen, uiText as chalk } from '@ui/primitives';
import {
  buildTimelineSteps,
  calculateTotalDuration,
  findSlowestRecord,
  groupRecordsByStepIndex,
} from './records';
import { generateTimelineTable } from './table';

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
  const totalDuration = calculateTotalDuration(stepGroups);
  const totalDurationSec = (totalDuration / 1000).toFixed(1);

  // Find slowest step
  const slowestRecord = findSlowestRecord(history.records);
  const slowestStepNumber = history.records.indexOf(slowestRecord) + 1;
  const slowestDurationSec = (slowestRecord.duration / 1000).toFixed(1);

  // Build timeline steps
  const timelineSteps = buildTimelineSteps(stepGroups);

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
