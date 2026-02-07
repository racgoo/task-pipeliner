/**
 * History display utilities for tp history show
 * Renders workflow execution history and individual step records.
 */

import boxen from 'boxen';
import chalk from 'chalk';
import dayjs from 'dayjs';
import type { History, Record as WorkflowRecord, Step } from '../types/workflow';
import { generateTimeline } from './timeline';
import { formatDuration } from './ui';

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
    chalk.bold('Workflow Execution History'),
    '',
    `${chalk.cyan('File:')} ${filename}`,
    `${chalk.cyan('Started:')} ${startTime}`,
    `${chalk.cyan('Total Duration:')} ${durationSec}`,
    `${chalk.cyan('Total Steps:')} ${history.records.length}`,
    `${chalk.green('✓ Successful:')} ${successCount}`,
    failureCount > 0 ? `${chalk.red('✗ Failed:')} ${failureCount}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  console.log(
    boxen(headerContent, {
      borderStyle: 'round',
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      borderColor: 'cyan',
    })
  );

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
  const statusIcon = record.status === 'success' ? chalk.green('✓') : chalk.red('✗');
  const statusText = record.status === 'success' ? chalk.green('Success') : chalk.red('Failed');
  const duration = formatDuration(record.duration);

  const stepHeader = [
    `${statusIcon} ${chalk.bold(`Step ${stepNumber}/${totalSteps}`)} - ${chalk.cyan(stepType)}`,
    `${chalk.gray('Duration:')} ${duration} | ${chalk.gray('Status:')} ${statusText}`,
    '',
    chalk.white(stepDescription),
  ].join('\n');

  console.log(
    boxen(stepHeader, {
      borderStyle: 'round',
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      borderColor: record.status === 'success' ? 'green' : 'red',
    })
  );

  if (isTaskRunResult(record.output)) {
    displayTaskOutput(record.output);
  }
}

function getStepType(step: Step): string {
  if ('run' in step) return 'Run';
  if ('choose' in step) return 'Choose';
  if ('prompt' in step) return 'Prompt';
  if ('parallel' in step) return 'Parallel';
  if ('fail' in step) return 'Fail';
  return 'Unknown';
}

/**
 * Step description with resolved values (command after substitution, choice/prompt result)
 */
function getStepDescription(record: WorkflowRecord): string {
  const step = record.step;
  const lines: string[] = [];

  if ('run' in step) {
    const resolved = record.resolvedCommand;
    const displayCmd = resolved ?? step.run;
    lines.push(`Command: ${chalk.yellow(displayCmd)}`);
    if (resolved && resolved !== step.run) {
      lines.push(`${chalk.gray('Template:')} ${chalk.gray(step.run)}`);
    }
  } else if ('choose' in step) {
    lines.push(`Message: ${chalk.yellow(step.choose.message)}`);
    if (record.choiceValue !== undefined) {
      const label =
        step.choose.options.find((o) => o.id === record.choiceValue)?.label ?? record.choiceValue;
      lines.push(
        `${chalk.gray('Selected:')} ${chalk.cyan(record.choiceValue)}${label !== record.choiceValue ? ` (${label})` : ''}`
      );
    }
  } else if ('prompt' in step) {
    lines.push(
      `Message: ${chalk.yellow(step.prompt.message)} | Variable: ${chalk.cyan(step.prompt.as)}`
    );
    if (record.promptValue !== undefined) {
      lines.push(`${chalk.gray('Entered:')} ${chalk.cyan(String(record.promptValue))}`);
    }
  } else if ('parallel' in step) {
    lines.push(`Parallel execution with ${step.parallel.length} branches`);
  } else if ('fail' in step) {
    lines.push(`Error: ${chalk.red(step.fail.message)}`);
  } else {
    lines.push('Unknown step type');
  }

  return lines.join('\n');
}

function isTaskRunResult(
  output: unknown
): output is { success: boolean; stdout: string[]; stderr: string[] } {
  return (
    typeof output === 'object' &&
    output !== null &&
    'success' in output &&
    'stdout' in output &&
    'stderr' in output
  );
}

function displayTaskOutput(output: { success: boolean; stdout: string[]; stderr: string[] }): void {
  if (output.stdout.length > 0) {
    const stdoutContent = output.stdout.map((line) => chalk.gray(`  ${line}`)).join('\n');
    console.log(chalk.green('  Output:'));
    console.log(stdoutContent);
  }
  if (output.stderr.length > 0) {
    const stderrContent = output.stderr.map((line) => chalk.gray(`  ${line}`)).join('\n');
    console.log(chalk.red('  Errors:'));
    console.log(stderrContent);
  }
}
