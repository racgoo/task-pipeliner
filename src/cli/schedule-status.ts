import boxen from 'boxen';
import chalk from 'chalk';
import dayjs from 'dayjs';
import logUpdate from 'log-update';
import { getDaemonStatus } from '../core/daemon-manager';
import { ScheduleManager } from '../core/schedule-manager';
import { Schedule } from '../types/schedule';
import { formatScheduleCard } from './schedule-card-format';

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

/**
 * Generate status display content
 */
export async function generateStatusDisplay(): Promise<string> {
  const status = await getDaemonStatus();
  const manager = new ScheduleManager();
  const schedules = await manager.loadSchedules();

  const sections: string[] = [];

  let daemonContent: string;
  if (status.running && status.pid) {
    const uptime = formatUptime(status.startTime);
    const startTime = status.startTime
      ? dayjs(status.startTime).format('YYYY-MM-DD HH:mm:ss')
      : 'Unknown';

    daemonContent = [
      `${chalk.green('●')} ${chalk.green('active')} ${chalk.gray('(running)')}`,
      '',
      `${chalk.gray('Loaded:')} ${chalk.white(startTime)}`,
      `${chalk.gray('Active:')} ${chalk.green('active (running)')} since ${chalk.white(startTime)}`,
      `${chalk.gray('PID:')} ${chalk.white(status.pid.toString())}`,
      `${chalk.gray('Uptime:')} ${chalk.white(uptime)}`,
    ].join('\n');
  } else {
    daemonContent = [
      `${chalk.red('●')} ${chalk.red('inactive')} ${chalk.gray('(dead)')}`,
      '',
      `${chalk.gray('Loaded:')} ${chalk.gray('not found')}`,
      `${chalk.gray('Active:')} ${chalk.red('inactive (dead)')}`,
    ].join('\n');
  }

  const daemonBox = boxen(daemonContent, {
    title: chalk.bold('task-pipeliner-scheduler.service'),
    titleAlignment: 'left',
    borderStyle: 'round',
    padding: { top: 1, bottom: 1, left: 2, right: 2 },
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
    borderColor: status.running ? 'green' : 'red',
  });

  sections.push(daemonBox);

  if (schedules.length > 0) {
    const enabledCount = schedules.filter((s) => s.enabled).length;
    const schedulesHeader = chalk.bold(`Schedules: ${enabledCount}/${schedules.length} enabled`);
    sections.push(schedulesHeader);

    for (const schedule of schedules) {
      sections.push(formatScheduleStatus(schedule, status.running));
    }
  } else {
    const noSchedulesBox = boxen(chalk.gray('No schedules configured'), {
      borderStyle: 'round',
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      borderColor: 'gray',
    });
    sections.push(noSchedulesBox);
  }

  return sections.join('\n');
}

/** Clear screen and move cursor to top so status always draws from top (avoids top being cut off with many schedules) */
export function clearScreenToTop(): void {
  process.stdout.write('\x1b[2J\x1b[H');
}

/**
 * Show scheduler daemon status
 */
export async function showSchedulerStatus(follow: boolean): Promise<void> {
  if (follow) {
    let running = true;

    const cleanup = () => {
      running = false;
      logUpdate.done();
      process.exit(0);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    const updateInterval = setInterval(async () => {
      if (!running) {
        clearInterval(updateInterval);
        return;
      }

      try {
        const display = await generateStatusDisplay();
        const status = await getDaemonStatus();
        const footer = status.running
          ? chalk.gray('\nPress Ctrl+C to exit this view (daemon keeps running in background)')
          : chalk.gray(
              '\nTip: To start the daemon, run: tp schedule start -d. Press Ctrl+C to exit this view.'
            );
        logUpdate(`${display}${footer}`);
      } catch (error) {
        logUpdate.done();
        console.error('Error updating status:', error);
        clearInterval(updateInterval);
        process.exit(1);
      }
    }, 1000);

    clearScreenToTop();
    const initialDisplay = await generateStatusDisplay();
    const status = await getDaemonStatus();
    const footer = status.running
      ? chalk.gray('\nPress Ctrl+C to exit this view (daemon keeps running in background)')
      : chalk.gray(
          '\nTip: To start the daemon, run: tp schedule start -d. Press Ctrl+C to exit this view.'
        );
    logUpdate(`${initialDisplay}${footer}`);

    await new Promise(() => {});
  } else {
    clearScreenToTop();
    const display = await generateStatusDisplay();
    const status = await getDaemonStatus();
    const footer = status.running
      ? ''
      : chalk.gray('\nTip: To start the daemon, run: tp schedule start -d');
    console.log(`${display}${footer}\n`);
  }
}
