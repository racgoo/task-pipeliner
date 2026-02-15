/**
 * History display utilities for tp history show
 * Renders workflow execution history and individual step records.
 */

import type { History, Record as WorkflowRecord } from '@tp-types/workflow';
import { formatDuration } from '@ui/index';
import { uiBoxPreset, uiTone } from '@ui/primitives';
import dayjs from 'dayjs';
import { generateTimeline } from '../timeline/index';
import { displayTaskOutput, getStepDescription, getStepType, isTaskRunResult } from './record-view';

/**
 * Display workflow execution history (header + each record)
 */
export function displayHistory(history: History, filename: string): void {
  console.log();

  const totalDuration = history.records.reduce((sum, record) => sum + record.duration, 0);
  const successCount = history.records.filter((r) => r.status === 'success').length;
  const failureCount = history.records.filter((r) => r.status === 'failure').length;
  const startTime = dayjs(history.initialTimestamp).format('YYYY-MM-DD HH:mm:ss');
  const durationSec = formatDuration(totalDuration);

  const headerContent = [
    uiTone.strong('Workflow Execution History'),
    '',
    `${uiTone.accent('File:')} ${filename}`,
    `${uiTone.accent('Started:')} ${startTime}`,
    `${uiTone.accent('Total Duration:')} ${durationSec}`,
    `${uiTone.accent('Total Steps:')} ${history.records.length}`,
    `${uiTone.success('✓ Successful:')} ${successCount}`,
    failureCount > 0 ? `${uiTone.error('✗ Failed:')} ${failureCount}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  console.log(uiBoxPreset.info(headerContent));

  history.records.forEach((record, index) => {
    displayRecord(record, index + 1, history.records.length);
  });

  // Display timeline
  const timeline = generateTimeline(history);
  if (timeline) {
    console.log(timeline);
  }

  console.log();
}

/**
 * Display a single execution record (step box + optional task output)
 */
export function displayRecord(
  record: WorkflowRecord,
  stepNumber: number,
  totalSteps: number
): void {
  const stepType = getStepType(record.step);
  const stepDescription = getStepDescription(record);
  const statusIcon = record.status === 'success' ? uiTone.success('✓') : uiTone.error('✗');
  const statusText =
    record.status === 'success' ? uiTone.success('Success') : uiTone.error('Failed');
  const duration = formatDuration(record.duration);

  const stepHeader = [
    `${statusIcon} ${uiTone.strong(`Step ${stepNumber}/${totalSteps}`)} - ${uiTone.accent(stepType)}`,
    `${uiTone.muted('Duration:')} ${duration} | ${uiTone.muted('Status:')} ${statusText}`,
    '',
    uiTone.plain(stepDescription),
  ].join('\n');

  console.log(
    uiBoxPreset.panel(stepHeader, {
      borderColor: record.status === 'success' ? 'green' : 'red',
    })
  );

  if (isTaskRunResult(record.output)) {
    displayTaskOutput(record.output);
  }
}
