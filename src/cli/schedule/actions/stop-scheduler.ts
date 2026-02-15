import { getDaemonStatus } from '@core/scheduling/daemon-manager';
import { createCliScheduler } from '../../core-adapters';

/**
 * Stop the scheduler daemon
 */
export async function stopScheduler(): Promise<void> {
  const status = await getDaemonStatus();

  if (!status.running) {
    console.log('Scheduler daemon is not running');
    return;
  }

  console.log(`Stopping scheduler daemon (PID: ${status.pid})...`);

  const scheduler = createCliScheduler();
  const stopped = await scheduler.stopDaemon();

  if (stopped) {
    console.log('✓ Scheduler daemon stopped');
  } else {
    console.log('✗ Failed to stop scheduler daemon (process may have already exited)');
  }
}
