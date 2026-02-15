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
): () => void {
  if (!(process.stdin.isTTY && process.stdout.isTTY)) {
    return () => {};
  }

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  const onData = (data: Buffer | string) => {
    const buffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;

    // In raw mode Ctrl+C sends 0x03 (ETX), not SIGINT; handle it explicitly
    if (buffer.length === 1 && buffer[0] === 0x03) {
      cleanup();
      return;
    }

    const key = parseScrollKey(buffer);
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
  };

  process.stdin.on('data', onData);

  return () => {
    process.stdin.off('data', onData);
  };
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

  let resolveDone: (() => void) | undefined;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  const teardown: {
    removeInputListener: () => void;
    interval?: NodeJS.Timeout;
    signalHandler?: () => void;
  } = {
    removeInputListener: () => {},
  };

  const finalize = () => {
    if (teardown.interval) {
      clearInterval(teardown.interval);
      teardown.interval = undefined;
    }

    if (teardown.signalHandler) {
      process.off('SIGINT', teardown.signalHandler);
      process.off('SIGTERM', teardown.signalHandler);
      teardown.signalHandler = undefined;
    }

    teardown.removeInputListener();

    if (isTTY && process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }

    logUpdate.done();
  };

  const cleanup = () => {
    if (!running) {
      return;
    }

    running = false;
    finalize();
    resolveDone?.();
  };

  const fail = (error: unknown) => {
    if (!running) {
      return;
    }

    running = false;
    finalize();
    console.error('Error updating status:', error);
    process.exitCode = 1;
    resolveDone?.();
  };

  const onSignal = () => {
    cleanup();
  };
  teardown.signalHandler = onSignal;
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);

  teardown.removeInputListener = setupTTYInput(
    viewportHeight,
    () => state,
    (nextState) => {
      state = nextState;
    },
    cleanup
  );

  const safeRefresh = async () => {
    try {
      state = await refreshFollowView(isTTY, viewportHeight, state);
    } catch (error) {
      fail(error);
    }
  };

  teardown.interval = setInterval(() => {
    if (!running) {
      return;
    }

    void safeRefresh();
  }, 1000);

  clearScreenToTop();
  await safeRefresh();

  await done;
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
