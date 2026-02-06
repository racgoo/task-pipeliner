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
    margin: { top: 1, bottom: 0, left: 0, right: 0 },
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

  // Prepend blank lines so the box top is not clipped when the first line is lost (e.g. TTY/viewport)
  return `\n\n${sections.join('\n')}`;
}

/** Clear screen and move cursor to top so status always draws from top (avoids top being cut off with many schedules) */
export function clearScreenToTop(): void {
  process.stdout.write('\x1b[2J\x1b[H');
}

const VIEWPORT_FOOTER_LINES = 2;
const DEFAULT_ROWS = 24;

function getViewportHeight(): number {
  const rows = typeof process.stdout.rows === 'number' ? process.stdout.rows : DEFAULT_ROWS;
  return Math.max(5, rows - VIEWPORT_FOOTER_LINES);
}

/** Parse key from stdin buffer (arrow keys, page up/down, home/end) */
function parseScrollKey(
  data: Buffer
): 'up' | 'down' | 'pageup' | 'pagedown' | 'home' | 'end' | null {
  const s = data.toString('utf8');
  if (s === '\u001b[A') return 'up';
  if (s === '\u001b[B') return 'down';
  if (s === '\u001b[5~') return 'pageup';
  if (s === '\u001b[6~') return 'pagedown';
  if (s === '\u001b[H' || s === '\u001b[1~') return 'home';
  if (s === '\u001b[4~' || s === '\u001b[F') return 'end';
  return null;
}

/**
 * Show scheduler daemon status.
 * In follow mode with TTY: scrollable viewport with ↑/↓ PgUp/PgDn (PM2-style). Real-time updates keep scroll position stable.
 */
export async function showSchedulerStatus(follow: boolean): Promise<void> {
  if (follow) {
    const isTTY = process.stdin.isTTY && process.stdout.isTTY;
    const viewportHeight = getViewportHeight();

    let running = true;
    let lastLines: string[] = [];
    let lastFooter = '';
    let scrollOffset = 0;

    const renderViewport = () => {
      const total = lastLines.length;
      const maxScroll = Math.max(0, total - viewportHeight);
      const clamped = Math.min(scrollOffset, maxScroll);
      scrollOffset = clamped;
      const view = lastLines.slice(scrollOffset, scrollOffset + viewportHeight).join('\n');
      const scrollHint =
        total > viewportHeight
          ? chalk.dim(
              ` [${scrollOffset + 1}-${Math.min(scrollOffset + viewportHeight, total)}/${total}] ↑/↓ PgUp/PgDn: scroll`
            )
          : '';
      logUpdate(`${view}\n${lastFooter}${scrollHint}`);
    };

    const cleanup = () => {
      running = false;
      if (isTTY && process.stdin.isTTY) {
        process.stdin.setRawMode(false);
        process.stdin.pause();
      }
      logUpdate.done();
      process.exit(0);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    if (isTTY && process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (data: Buffer | string) => {
        const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
        // In raw mode Ctrl+C sends 0x03 (ETX), not SIGINT; handle it explicitly
        if (buf.length === 1 && buf[0] === 0x03) {
          cleanup();
          return;
        }
        const key = parseScrollKey(buf);
        if (!key || lastLines.length <= viewportHeight) {
          if (key) renderViewport();
          return;
        }
        const maxScroll = Math.max(0, lastLines.length - viewportHeight);
        switch (key) {
          case 'up':
            scrollOffset = Math.max(0, scrollOffset - 1);
            break;
          case 'down':
            scrollOffset = Math.min(maxScroll, scrollOffset + 1);
            break;
          case 'pageup':
            scrollOffset = Math.max(0, scrollOffset - viewportHeight);
            break;
          case 'pagedown':
            scrollOffset = Math.min(maxScroll, scrollOffset + viewportHeight);
            break;
          case 'home':
            scrollOffset = 0;
            break;
          case 'end':
            scrollOffset = maxScroll;
            break;
        }
        renderViewport();
      });
    }

    const refreshAndRender = async () => {
      try {
        const display = await generateStatusDisplay();
        const status = await getDaemonStatus();
        lastFooter = status.running
          ? chalk.gray('\nCtrl+C: exit (daemon keeps running)')
          : chalk.gray('\nTip: tp schedule start -d to start daemon. Ctrl+C: exit.');
        lastLines = display.split('\n');
        if (isTTY) {
          renderViewport();
        } else {
          const footer = status.running
            ? chalk.gray('\nPress Ctrl+C to exit (daemon keeps running in background)')
            : chalk.gray(
                '\nTip: To start the daemon, run: tp schedule start -d. Press Ctrl+C to exit.'
              );
          logUpdate(`${display}${footer}`);
        }
      } catch (error) {
        logUpdate.done();
        console.error('Error updating status:', error);
        process.exit(1);
      }
    };

    const updateInterval = setInterval(async () => {
      if (!running) {
        clearInterval(updateInterval);
        return;
      }
      await refreshAndRender();
    }, 1000);

    clearScreenToTop();
    await refreshAndRender();

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
