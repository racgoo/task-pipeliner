import { uiText as chalk } from '@ui/primitives';
import { formatScheduleCard } from '../card-format';
import { chooseSchedule, createScheduleManager, loadDaemonStatus } from './action-helpers';

/**
 * Toggle schedule enabled/disabled
 */
export async function toggleSchedule(): Promise<void> {
  const manager = createScheduleManager();
  const schedules = await manager.loadSchedules();

  if (schedules.length === 0) {
    console.log('No schedules found');
    return;
  }

  const schedule = await chooseSchedule(schedules, 'Select schedule to toggle:', 'color');
  if (!schedule) {
    console.log('✗ Schedule not found');
    return;
  }
  const scheduleId = schedule.id;

  const newStatus = !schedule.enabled;
  await manager.toggleSchedule(scheduleId, newStatus);

  const daemonStatus = await loadDaemonStatus();
  const updated = { ...schedule, enabled: newStatus };

  const statusLabel = newStatus ? chalk.bold.green('ENABLED') : chalk.bold.gray('DISABLED');
  const statusHint = newStatus
    ? chalk.dim(' (will run at the times shown below)')
    : chalk.dim(' (will not run until you enable it again)');
  console.log(`\n✓ Schedule is now ${statusLabel}${statusHint}\n`);
  console.log(
    formatScheduleCard(updated, { daemonRunning: daemonStatus.running, emphasizeState: true })
  );
}
