import inquirer from 'inquirer';
import { formatScheduleCard } from '../card-format';
import { chooseSchedule, createScheduleManager, loadDaemonStatus } from './action-helpers';

/**
 * Remove a schedule
 */
export async function removeSchedule(): Promise<void> {
  const manager = createScheduleManager();
  const schedules = await manager.loadSchedules();

  if (schedules.length === 0) {
    console.log('No schedules found');
    return;
  }

  const scheduleToRemove = await chooseSchedule(schedules, 'Select schedule to remove:');
  if (!scheduleToRemove) {
    console.log('✗ Schedule not found');
    return;
  }
  const scheduleId = scheduleToRemove.id;

  const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to remove this schedule?',
      default: false,
    },
  ]);

  if (!confirm) {
    console.log('Cancelled');
    return;
  }

  const success = await manager.removeSchedule(scheduleId);

  if (success) {
    const daemonStatus = await loadDaemonStatus();
    console.log('\n✓ Schedule removed\n');
    console.log(formatScheduleCard(scheduleToRemove, { daemonRunning: daemonStatus.running }));
  } else {
    console.log('✗ Schedule not found');
  }
}
