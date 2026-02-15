import { Command } from 'commander';
import {
  addSchedules,
  listSchedules,
  removeAllSchedules,
  removeSchedule,
  startScheduler,
  stopScheduler,
  toggleSchedule,
} from './actions';
import { showSchedulerStatus } from './status';

/**
 * Create schedule command
 */
export function createScheduleCommand(): Command {
  const scheduleCmd = new Command('schedule')
    .description('Manage workflow schedules')
    .action(async () => {
      // Show schedule list by default
      await listSchedules();
    });

  // Add subcommand
  scheduleCmd
    .command('add [scheduleFile]')
    .description(
      'Add schedules from a schedule file (YAML or JSON). If no file given, select from nearest tp/schedules directory.'
    )
    .action(async (scheduleFilePath?: string) => {
      await addSchedules(scheduleFilePath);
    });

  // Remove subcommand
  scheduleCmd
    .command('remove')
    .alias('rm')
    .description('Remove a workflow schedule')
    .action(async () => {
      await removeSchedule();
    });

  // Remove all subcommand
  scheduleCmd
    .command('remove-all')
    .description('Remove all workflow schedules')
    .action(async () => {
      await removeAllSchedules();
    });

  // List subcommand
  scheduleCmd
    .command('list')
    .alias('ls')
    .description('List all workflow schedules')
    .action(async () => {
      await listSchedules();
    });

  // Start daemon subcommand
  scheduleCmd
    .command('start')
    .description('Start the scheduler daemon')
    .option('-d, --daemon', 'Run in background daemon mode')
    .action(async (options: { daemon?: boolean }) => {
      await startScheduler(options.daemon ?? false);
    });

  // Stop daemon subcommand
  scheduleCmd
    .command('stop')
    .description('Stop the scheduler daemon')
    .action(async () => {
      await stopScheduler();
    });

  // Status subcommand (view only; does not start the daemon)
  scheduleCmd
    .command('status')
    .description(
      'View daemon and schedule status (does not start the daemon). In live mode, Ctrl+C only exits the status view; the daemon keeps running if it was started with "tp schedule start -d".'
    )
    .option('-n, --no-follow', 'Show status once and exit (no live refresh)')
    .action(async (options: { follow?: boolean }) => {
      const follow = options.follow !== false;
      await showSchedulerStatus(follow);
    });

  // Enable/disable subcommand
  scheduleCmd
    .command('toggle')
    .description('Enable or disable a schedule')
    .action(async () => {
      await toggleSchedule();
    });

  return scheduleCmd;
}
