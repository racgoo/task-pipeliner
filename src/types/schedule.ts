/**
 * Schedule types for workflow scheduling
 */

export interface Schedule {
  id: string;
  name?: string;
  workflowPath: string;
  cron: string;
  enabled: boolean;
  createdAt: string;
  lastRun?: string;
}

export interface ScheduleConfig {
  schedules: Schedule[];
}
