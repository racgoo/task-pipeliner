import type { Schedule } from '@tp-types/schedule';
import { uiBox as boxen, uiText as chalk } from '@ui/primitives';
import dayjs from 'dayjs';
import { formatScheduleCard } from '../card-format';

export interface SchedulerDaemonStatus {
  running: boolean;
  pid: number | null;
  startTime: string | null;
}

/**
 * Format duration in human-readable format
 */
export function formatUptime(startTime: string | null): string {
  if (!startTime) return 'Unknown';
  const start = dayjs(startTime);
  const now = dayjs();
  const diff = now.diff(start, 'second');

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

/** Format schedule card for status view (same as list/start). */
export function formatScheduleStatus(schedule: Schedule, daemonRunning: boolean): string {
  return formatScheduleCard(schedule, { daemonRunning });
}

function buildDaemonContent(status: SchedulerDaemonStatus): string {
  if (status.running && status.pid) {
    const uptime = formatUptime(status.startTime);
    const startTime = status.startTime
      ? dayjs(status.startTime).format('YYYY-MM-DD HH:mm:ss')
      : 'Unknown';

    return [
      `${chalk.green('●')} ${chalk.green('active')} ${chalk.gray('(running)')}`,
      '',
      `${chalk.gray('Loaded:')} ${chalk.white(startTime)}`,
      `${chalk.gray('Active:')} ${chalk.green('active (running)')} since ${chalk.white(startTime)}`,
      `${chalk.gray('PID:')} ${chalk.white(status.pid.toString())}`,
      `${chalk.gray('Uptime:')} ${chalk.white(uptime)}`,
    ].join('\n');
  }

  return [
    `${chalk.red('●')} ${chalk.red('inactive')} ${chalk.gray('(dead)')}`,
    '',
    `${chalk.gray('Loaded:')} ${chalk.gray('not found')}`,
    `${chalk.gray('Active:')} ${chalk.red('inactive (dead)')}`,
  ].join('\n');
}

function buildDaemonBox(status: SchedulerDaemonStatus): string {
  return boxen(buildDaemonContent(status), {
    title: chalk.bold('task-pipeliner-scheduler.service'),
    titleAlignment: 'left',
    borderStyle: 'round',
    padding: { top: 1, bottom: 1, left: 2, right: 2 },
    margin: { top: 1, bottom: 0, left: 0, right: 0 },
    borderColor: status.running ? 'green' : 'red',
  });
}

function buildSchedulesSection(schedules: Schedule[], daemonRunning: boolean): string[] {
  if (schedules.length > 0) {
    const enabledCount = schedules.filter((s) => s.enabled).length;
    const schedulesHeader = chalk.bold(`Schedules: ${enabledCount}/${schedules.length} enabled`);
    const cards = schedules.map((schedule) => formatScheduleStatus(schedule, daemonRunning));
    return [schedulesHeader, ...cards];
  }

  const noSchedulesBox = boxen(chalk.gray('No schedules configured'), {
    borderStyle: 'round',
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
    borderColor: 'gray',
  });
  return [noSchedulesBox];
}

/**
 * Generate status display content
 */
export function generateStatusDisplayContent(
  status: SchedulerDaemonStatus,
  schedules: Schedule[]
): string {
  const sections: string[] = [];

  sections.push(buildDaemonBox(status));
  sections.push(...buildSchedulesSection(schedules, status.running));

  // Prepend blank lines so the box top is not clipped when the first line is lost (e.g. TTY/viewport)
  return `\n\n${sections.join('\n')}`;
}
