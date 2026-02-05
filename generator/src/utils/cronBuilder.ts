/**
 * Build cron expression from recurrence + time options
 * 5-field: minute hour day-of-month month day-of-week
 * 6-field: second minute hour day-of-month month day-of-week
 */

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'everyMinutes' | 'everySeconds';

export interface CronBuilderState {
  type: RecurrenceType;
  hour: number;
  minute: number;
  dayOfMonth: number;
  weekDays: number[]; // 0-6, 0 = Sunday
  everyN: number;
  useSeconds: boolean;
}

export const DEFAULT_CRON_STATE: CronBuilderState = {
  type: 'daily',
  hour: 9,
  minute: 0,
  dayOfMonth: 1,
  weekDays: [1],
  everyN: 5,
  useSeconds: false,
};

/**
 * Build cron expression from builder state
 */
export function buildCronFromState(state: CronBuilderState): string {
  const { type, hour, minute, dayOfMonth, weekDays, everyN } = state;

  switch (type) {
    case 'daily':
      return `${minute} ${hour} * * *`;
    case 'weekly': {
      const days = [...weekDays].sort((a, b) => a - b).join(',');
      return `${minute} ${hour} * * ${days}`;
    }
    case 'monthly':
      return `${minute} ${hour} ${dayOfMonth} * *`;
    case 'everyMinutes':
      return `*/${everyN} * * * *`;
    case 'everySeconds':
      return `*/${everyN} * * * * *`;
    default:
      return '0 9 * * *';
  }
}

export const CRON_PRESETS: { label: string; cron: string }[] = [
  { label: 'Every day at 9:00', cron: '0 9 * * *' },
  { label: 'Every day at 0:00 (midnight)', cron: '0 0 * * *' },
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Every Monday at 0:00', cron: '0 0 * * 1' },
  { label: 'Every 15 minutes', cron: '*/15 * * * *' },
  { label: 'Every 5 minutes', cron: '*/5 * * * *' },
  { label: 'Every 5 seconds', cron: '*/5 * * * * *' },
  { label: 'Every minute', cron: '* * * * *' },
  { label: 'Custom / Build', cron: '' },
];

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
