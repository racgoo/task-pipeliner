import { spawn } from 'child_process';
import {
  getDaemonErrorLogPath,
  getDaemonStatus,
  isDaemonRunning,
  readDaemonErrorLog,
  writeDaemonError,
} from '@core/scheduling/daemon-manager';
import { uiText as chalk } from '@ui/primitives';
import { createCliScheduler } from '../../core-adapters';
import { throwHandledCliError } from '../../shared/command-runtime';
import { formatScheduleCard } from '../card-format';
import { waitForSchedulerShutdownSignal } from '../runtime/lifecycle';

/**
 * Start the scheduler daemon
 */
export async function startScheduler(daemonMode: boolean): Promise<void> {
  if (await isDaemonRunning()) {
    const status = await getDaemonStatus();
    console.error(`✗ Scheduler daemon is already running (PID: ${status.pid})`);
    console.error('  Run "tp schedule stop" to stop it first');
    throwHandledCliError(1);
  }

  if (daemonMode) {
    if (process.env.TP_DAEMON_MODE === 'true') {
      try {
        const { saveDaemonPid } = await import('@core/scheduling/daemon-manager');
        await saveDaemonPid();

        const scheduler = createCliScheduler();
        await scheduler.start(true);
        await waitForSchedulerShutdownSignal({ scheduler, daemonMode: true });
      } catch (error) {
        await writeDaemonError(error instanceof Error ? error : new Error(String(error)));
        throwHandledCliError(1);
      }
      return;
    }

    const args = process.argv.slice(1);
    const child = spawn(process.argv[0], args, {
      detached: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        TP_DAEMON_MODE: 'true',
      },
    });

    child.unref();

    const maxAttempts = 3;
    const delayMs = 800;
    let running = false;

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      if (await isDaemonRunning()) {
        running = true;
        break;
      }
    }

    if (running) {
      const status = await getDaemonStatus();
      console.log(`✓ Scheduler daemon started in background (PID: ${status.pid})`);
      console.log('  Run "tp schedule stop" to stop the daemon');
      console.log('  Run "tp schedule status" to check daemon status');
      return;
    }

    console.error('✗ Failed to start scheduler daemon');
    const errorLog = await readDaemonErrorLog();
    if (errorLog) {
      console.error(chalk.dim('  Last error from daemon:'));
      console.error(
        chalk.red(
          errorLog
            .split('\n')
            .map((line) => `  ${line}`)
            .join('\n')
        )
      );
    } else {
      console.error(chalk.dim(`  Check ${getDaemonErrorLogPath()} for details`));
    }
    throwHandledCliError(1);
  }

  const scheduler = createCliScheduler();
  await scheduler.start(false, {
    onScheduleStarted: (schedule) =>
      console.log(formatScheduleCard(schedule, { daemonRunning: true })),
  });
  await waitForSchedulerShutdownSignal({ scheduler, daemonMode: false });
}
