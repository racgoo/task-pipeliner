import { getDaemonStatus } from '@core/scheduling/daemon-manager';
import { ScheduleManager } from '@core/scheduling/schedule-manager';
import type { Schedule } from '@tp-types/schedule';
import { ChoicePrompt } from '../../prompts';
import { scheduleChoiceLabel } from './shared';

export function createScheduleManager(): ScheduleManager {
  return new ScheduleManager();
}

export async function loadDaemonStatus() {
  return getDaemonStatus();
}

export async function chooseSchedule(
  schedules: Schedule[],
  message: string,
  style: 'plain' | 'color' = 'plain'
): Promise<Schedule | undefined> {
  const choicePrompt = new ChoicePrompt(true);
  const selected = await choicePrompt.prompt(
    message,
    schedules.map((schedule) => ({
      id: schedule.id,
      label: scheduleChoiceLabel(schedule, style),
    }))
  );

  const schedule = schedules.find((item) => item.id === selected.id);
  return schedule;
}
