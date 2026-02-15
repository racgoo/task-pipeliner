import { getDaemonStatus } from '@core/scheduling/daemon-manager';
import { ScheduleManager } from '@core/scheduling/schedule-manager';
import { uiText as chalk } from '@ui/primitives';
import { ChoicePrompt } from '../../prompts';
import { formatScheduleCard } from '../card-format';
import { scheduleChoiceLabel } from './shared';

/**
 * Toggle schedule enabled/disabled
 */
export async function toggleSchedule(): Promise<void> {
  const manager = new ScheduleManager();
  const schedules = await manager.loadSchedules();

  if (schedules.length === 0) {
    console.log('No schedules found');
    return;
  }

  const choices = schedules.map((s) => ({
    id: s.id,
    label: scheduleChoiceLabel(s, 'color'),
  }));
  const choicePrompt = new ChoicePrompt(true);
  const selected = await choicePrompt.prompt('Select schedule to toggle:', choices);
  const scheduleId = selected.id;

  const schedule = schedules.find((s) => s.id === scheduleId);
  if (!schedule) {
    console.log('✗ Schedule not found');
    return;
  }

  const newStatus = !schedule.enabled;
  await manager.toggleSchedule(scheduleId, newStatus);

  const daemonStatus = await getDaemonStatus();
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
