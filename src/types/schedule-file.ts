/**
 * Schedule file types for defining multiple schedules in YAML/JSON
 */

export interface ScheduleDefinition {
  name: string; // Schedule name (alias for identification)
  cron: string; // Cron expression
  workflow: string; // Path to workflow file
  baseDir?: string; // Optional: base directory for workflow path
  silent?: boolean; // Optional: run in silent mode (-s)
  profile?: string; // Optional: profile name to use (-p)
}

export interface ScheduleFile {
  schedules: ScheduleDefinition[];
}
