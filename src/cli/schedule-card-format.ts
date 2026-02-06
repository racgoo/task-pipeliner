import boxen from 'boxen';
import chalk from 'chalk';
import cronstrue from 'cronstrue';
import dayjs from 'dayjs';
import cron from 'node-cron';
import { resolveTimezone } from '../core/timezone-offset';
import { Schedule } from '../types/schedule';

export function getCronDescription(cronExpr: string): string | null {
  try {
    return cronstrue.toString(cronExpr);
  } catch {
    return null;
  }
}

/**
 * Get next run time for a schedule (without starting the task)
 */
export function getNextRunForSchedule(schedule: Schedule): Date | null {
  if (!cron.validate(schedule.cron)) return null;
  try {
    const options: { timezone?: string } = {};
    const resolvedTz = resolveTimezone(schedule.timezone);
    if (resolvedTz) options.timezone = resolvedTz;
    const task = cron.createTask(schedule.cron, () => {}, options);
    const next = task.getNextRun();
    task.destroy();
    return next;
  } catch {
    return null;
  }
}

export interface FormatScheduleCardOptions {
  /** When true, enabled schedules show as "active" */
  daemonRunning: boolean;
  /** When true, show a prominent ENABLED/DISABLED badge (e.g. for toggle result) */
  emphasizeState?: boolean;
}

/**
 * Format a single schedule as a boxen card (same layout for list, status, and start).
 */
export function formatScheduleCard(schedule: Schedule, options: FormatScheduleCardOptions): string {
  const s = schedule;
  const { daemonRunning, emphasizeState } = options;
  const toggleLabel = s.enabled
    ? emphasizeState
      ? chalk.bold.green('ENABLED')
      : chalk.green('enabled')
    : emphasizeState
      ? chalk.bold.gray('DISABLED')
      : chalk.gray('disabled');
  const isActive = daemonRunning && s.enabled;
  const activeBadge = isActive ? chalk.green('● active') : chalk.gray('○ inactive');
  const stateBadge = emphasizeState
    ? s.enabled
      ? chalk.bold.green('  [ENABLED]')
      : chalk.bold.gray('  [DISABLED]')
    : '';
  const name = chalk.bold(s.name ?? s.workflowPath);
  const nextRun = getNextRunForSchedule(s);
  const nextRunStr = nextRun ? dayjs(nextRun).format('YYYY-MM-DD HH:mm:ss') : chalk.dim('—');
  const lastRunStr = s.lastRun
    ? dayjs(s.lastRun).format('YYYY-MM-DD HH:mm:ss')
    : chalk.dim('never');
  const cronDesc = getCronDescription(s.cron);
  const tzStr = s.timezone
    ? s.timezone.startsWith('+') || s.timezone.startsWith('-')
      ? `UTC${s.timezone}`
      : `UTC+${s.timezone}`
    : null;

  const cronValue = cronDesc ? `${s.cron} ${chalk.dim(`→ ${cronDesc}`)}` : s.cron;

  const rows = [
    [chalk.gray('Enabled'), toggleLabel],
    [chalk.gray('Cron'), cronValue],
    ...(tzStr ? ([[chalk.gray('Timezone'), tzStr]] as [string, string][]) : []),
    [chalk.gray('Workflow'), s.workflowPath],
    ...(s.profile ? ([[chalk.gray('Profile'), chalk.cyan(s.profile)]] as [string, string][]) : []),
    ...(s.silent ? ([[chalk.gray('Silent'), chalk.yellow('yes')]] as [string, string][]) : []),
    [chalk.gray('Last run'), lastRunStr],
    [chalk.gray('Next run'), nextRunStr],
  ];

  const content = [
    `${name}  ${activeBadge}${stateBadge}`,
    ...rows.map(([label, value]) => `  ${label.padEnd(10)} ${value}`),
  ].join('\n');

  const borderColor = isActive ? 'green' : 'gray';
  return boxen(content, {
    borderStyle: 'round',
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
    borderColor,
  });
}
