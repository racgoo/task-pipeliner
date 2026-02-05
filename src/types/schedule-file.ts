/**
 * Schedule file types for defining multiple schedules in YAML/JSON
 */

export interface ScheduleDefinition {
  name: string; // Schedule name (alias for identification)
  cron: string; // Cron expression
  workflow: string; // Path to workflow file
  baseDir?: string; // Optional: base directory for workflow path
  timezone?: string; // Optional: UTC offset as number, e.g. +9, -5, 0 (hours). Omit = system local
  silent?: boolean; // Optional: run in silent mode (-s)
  profile?: string; // Optional: profile name to use (-p)
}

export interface ScheduleFile {
  schedules: ScheduleDefinition[];
}
