/**
 * Schedule types for workflow scheduling
 */

export interface Schedule {
  id: string;
  name?: string;
  workflowPath: string;
  cron: string;
  enabled: boolean;
  timezone?: string; // UTC offset: number e.g. +9, -5, 0 (hours). Omit = system local
  silent?: boolean;
  profile?: string;
  createdAt: string;
  lastRun?: string;
}

export interface ScheduleConfig {
  schedules: Schedule[];
}
