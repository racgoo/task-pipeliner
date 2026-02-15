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
import { formatScheduleCard } from '../card-format';

/**
 * Start the scheduler daemon
 */
export async function startScheduler(daemonMode: boolean): Promise<void> {
  if (await isDaemonRunning()) {
    const status = await getDaemonStatus();
    console.error(`✗ Scheduler daemon is already running (PID: ${status.pid})`);
    console.error('  Run "tp schedule stop" to stop it first');
    process.exit(1);
  }

  if (daemonMode) {
    if (process.env.TP_DAEMON_MODE === 'true') {
      try {
        const { saveDaemonPid } = await import('@core/scheduling/daemon-manager');
        await saveDaemonPid();

        const scheduler = createCliScheduler();
        await scheduler.start(true);

        await new Promise(() => {});
      } catch (err) {
        await writeDaemonError(err instanceof Error ? err : new Error(String(err)));
        process.exit(1);
      }
    } else {
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
      } else {
        console.error('✗ Failed to start scheduler daemon');
        const errLog = await readDaemonErrorLog();
        if (errLog) {
          console.error(chalk.dim('  Last error from daemon:'));
          console.error(
            chalk.red(
              errLog
                .split('\n')
                .map((l) => `  ${l}`)
                .join('\n')
            )
          );
        } else {
          console.error(chalk.dim(`  Check ${getDaemonErrorLogPath()} for details`));
        }
        process.exit(1);
      }

      process.exit(0);
    }
  } else {
    const scheduler = createCliScheduler();
    await scheduler.start(false, {
      onScheduleStarted: (s) => console.log(formatScheduleCard(s, { daemonRunning: true })),
    });

    await new Promise(() => {});
  }
}
