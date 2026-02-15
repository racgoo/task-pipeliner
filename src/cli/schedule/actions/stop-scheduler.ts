import { getDaemonStatus } from '@core/daemon-manager';
import { WorkflowScheduler } from '@core/scheduler';

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

  const scheduler = new WorkflowScheduler();
  const stopped = await scheduler.stopDaemon();

  if (stopped) {
    console.log('✓ Scheduler daemon stopped');
  } else {
    console.log('✗ Failed to stop scheduler daemon (process may have already exited)');
  }
}
