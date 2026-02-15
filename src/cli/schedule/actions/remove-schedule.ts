import { getDaemonStatus } from '@core/scheduling/daemon-manager';
import { ScheduleManager } from '@core/scheduling/schedule-manager';
import inquirer from 'inquirer';
import { ChoicePrompt } from '../../prompts';
import { formatScheduleCard } from '../card-format';
import { scheduleChoiceLabel } from './shared';

/**
 * Remove a schedule
 */
export async function removeSchedule(): Promise<void> {
  const manager = new ScheduleManager();
  const schedules = await manager.loadSchedules();

  if (schedules.length === 0) {
    console.log('No schedules found');
    return;
  }

  const choices = schedules.map((s) => ({
    id: s.id,
    label: scheduleChoiceLabel(s),
  }));
  const choicePrompt = new ChoicePrompt(true);
  const selected = await choicePrompt.prompt('Select schedule to remove:', choices);
  const scheduleId = selected.id;
  const scheduleToRemove = schedules.find((s) => s.id === scheduleId);

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

  if (success && scheduleToRemove) {
    const daemonStatus = await getDaemonStatus();
    console.log('\n✓ Schedule removed\n');
    console.log(formatScheduleCard(scheduleToRemove, { daemonRunning: daemonStatus.running }));
  } else if (success) {
    console.log('✓ Schedule removed successfully');
  } else {
    console.log('✗ Schedule not found');
  }
}
