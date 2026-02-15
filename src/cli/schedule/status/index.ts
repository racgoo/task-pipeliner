import { getDaemonStatus } from '@core/scheduling/daemon-manager';
import { ScheduleManager } from '@core/scheduling/schedule-manager';
import type { Schedule } from '@tp-types/schedule';
import { uiText as chalk } from '@ui/primitives';
import logUpdate from 'log-update';
import {
  formatScheduleStatus,
  formatUptime,
  generateStatusDisplayContent,
  type SchedulerDaemonStatus,
} from './display';
import { clearScreenToTop } from './screen';
import {
  applyScrollKey,
  getViewportHeight,
  parseScrollKey,
  renderViewport,
  type ViewportState,
} from './viewport';

/**
 * Generate status display content
 */
export async function generateStatusDisplay(): Promise<string> {
  const status = (await getDaemonStatus()) as SchedulerDaemonStatus;
  const manager = new ScheduleManager();
  const schedules = await manager.loadSchedules();
  return generateStatusDisplayContent(status, schedules);
}

function createNonTTYFooter(status: SchedulerDaemonStatus): string {
  return status.running
    ? chalk.gray('\nPress Ctrl+C to exit (daemon keeps running in background)')
    : chalk.gray('\nTip: To start the daemon, run: tp schedule start -d. Press Ctrl+C to exit.');
}

function createTTYFooter(status: SchedulerDaemonStatus): string {
  return status.running
    ? chalk.gray('\nCtrl+C: exit (daemon keeps running)')
    : chalk.gray('\nTip: tp schedule start -d to start daemon. Ctrl+C: exit.');
}

function setupTTYInput(
  viewportHeight: number,
  readState: () => ViewportState,
  writeState: (state: ViewportState) => void,
  cleanup: () => void
): void {
  if (!(process.stdin.isTTY && process.stdout.isTTY)) {
    return;
  }

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
    if (!key) {
      return;
    }

    const state = readState();
    if (state.lines.length <= viewportHeight) {
      const nextState = renderViewport(viewportHeight, state);
      writeState(nextState);
      return;
    }

    const nextOffset = applyScrollKey(key, viewportHeight, state.lines.length, state.scrollOffset);
    const nextState = renderViewport(viewportHeight, {
      ...state,
      scrollOffset: nextOffset,
    });
    writeState(nextState);
  });
}

async function refreshFollowView(
  isTTY: boolean,
  viewportHeight: number,
  state: ViewportState
): Promise<ViewportState> {
  const display = await generateStatusDisplay();
  const status = (await getDaemonStatus()) as SchedulerDaemonStatus;

  const nextState: ViewportState = {
    lines: display.split('\n'),
    footer: createTTYFooter(status),
    scrollOffset: state.scrollOffset,
  };

  if (isTTY) {
    return renderViewport(viewportHeight, nextState);
  }

  logUpdate(`${display}${createNonTTYFooter(status)}`);
  return nextState;
}

async function showSchedulerStatusFollowMode(): Promise<void> {
  const isTTY = process.stdin.isTTY && process.stdout.isTTY;
  const viewportHeight = getViewportHeight();

  let running = true;
  let state: ViewportState = {
    lines: [],
    footer: '',
    scrollOffset: 0,
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

  setupTTYInput(
    viewportHeight,
    () => state,
    (next) => {
      state = next;
    },
    cleanup
  );

  const safeRefresh = async () => {
    try {
      state = await refreshFollowView(isTTY, viewportHeight, state);
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
    await safeRefresh();
  }, 1000);

  clearScreenToTop();
  await safeRefresh();

  await new Promise(() => {});
}

/**
 * Show scheduler daemon status.
 * In follow mode with TTY: scrollable viewport with ↑/↓ PgUp/PgDn (PM2-style). Real-time updates keep scroll position stable.
 */
export async function showSchedulerStatus(follow: boolean): Promise<void> {
  if (follow) {
    await showSchedulerStatusFollowMode();
    return;
  }

  clearScreenToTop();
  const display = await generateStatusDisplay();
  const status = (await getDaemonStatus()) as SchedulerDaemonStatus;
  const footer = status.running
    ? ''
    : chalk.gray('\nTip: To start the daemon, run: tp schedule start -d');
  console.log(`${display}${footer}\n`);
}

export { clearScreenToTop, formatScheduleStatus, formatUptime };
export type { SchedulerDaemonStatus, Schedule };
