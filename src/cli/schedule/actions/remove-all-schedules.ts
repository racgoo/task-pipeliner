import { ScheduleManager } from '@core/schedule-manager';
import inquirer from 'inquirer';

/**
 * Remove all schedules
 */
export async function removeAllSchedules(): Promise<void> {
  const manager = new ScheduleManager();
  const schedules = await manager.loadSchedules();

  if (schedules.length === 0) {
    console.log('No schedules found');
    return;
  }

  const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to remove all ${schedules.length} schedule(s)?`,
      default: false,
    },
  ]);

  if (!confirm) {
    console.log('Cancelled');
    return;
  }

  await manager.saveSchedules([]);

  console.log(`✓ Removed all ${schedules.length} schedule(s)`);
}
