/**
 * Schedule file types (for tp schedule add)
 */

export interface ScheduleDefinition {
  name: string;
  cron: string;
  workflow: string;
  baseDir?: string;
  timezone?: string;
  silent?: boolean;
  profile?: string;
}

export interface ScheduleFile {
  schedules: ScheduleDefinition[];
}
