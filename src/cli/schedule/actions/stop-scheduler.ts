import { createCliScheduler } from '../../core-adapters';
import { loadDaemonStatus } from './action-helpers';

/**
 * Stop the scheduler daemon
 */
export async function stopScheduler(): Promise<void> {
  const status = await loadDaemonStatus();

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
