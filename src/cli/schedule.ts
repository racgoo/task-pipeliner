import { existsSync } from 'fs';
import { resolve } from 'path';
import { Command } from 'commander';
import dayjs from 'dayjs';
import inquirer from 'inquirer';
import cron from 'node-cron';
import { ScheduleManager } from '../core/schedule-manager';
import { WorkflowScheduler } from '../core/scheduler';

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
    .command('add [workflow]')
    .description('Add a new workflow schedule')
    .action(async (workflowPath?: string) => {
      await addSchedule(workflowPath);
    });

  // Remove subcommand
  scheduleCmd
    .command('remove')
    .alias('rm')
    .description('Remove a workflow schedule')
    .action(async () => {
      await removeSchedule();
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
    .action(async () => {
      await startScheduler();
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

/**
 * Add a new schedule
 */
async function addSchedule(workflowPath?: string): Promise<void> {
  const manager = new ScheduleManager();

  // Prompt for workflow path if not provided
  if (!workflowPath) {
    const { path } = await inquirer.prompt<{ path: string }>([
      {
        type: 'input',
        name: 'path',
        message: 'Workflow file path:',
        validate: (input: string) => {
          const resolved = resolve(input);
          if (!existsSync(resolved)) {
            return `File not found: ${resolved}`;
          }
          return true;
        },
      },
    ]);
    workflowPath = path;
  }

  const resolvedPath = resolve(workflowPath);

  // Check if file exists
  if (!existsSync(resolvedPath)) {
    console.error(`✗ File not found: ${resolvedPath}`);
    process.exit(1);
  }

  // Prompt for schedule details
  const answers = await inquirer.prompt<{
    name: string;
    cron: string;
    enabled: boolean;
  }>([
    {
      type: 'input',
      name: 'name',
      message: 'Schedule name (optional):',
    },
    {
      type: 'input',
      name: 'cron',
      message: 'Cron expression (e.g., "0 9 * * *" for daily at 9 AM):',
      validate: (input: string) => {
        if (!cron.validate(input)) {
          return 'Invalid cron expression. Format: minute hour day month weekday';
        }
        return true;
      },
    },
    {
      type: 'confirm',
      name: 'enabled',
      message: 'Enable this schedule?',
      default: true,
    },
  ]);

  // Add schedule
  const schedule = await manager.addSchedule({
    name: answers.name ?? undefined,
    workflowPath: resolvedPath,
    cron: answers.cron,
    enabled: answers.enabled,
  });

  console.log('\n✓ Schedule added successfully');
  console.log(`  ID: ${schedule.id}`);
  console.log(`  Name: ${schedule.name ?? 'N/A'}`);
  console.log(`  Workflow: ${schedule.workflowPath}`);
  console.log(`  Cron: ${schedule.cron}`);
  console.log(`  Status: ${schedule.enabled ? 'Enabled' : 'Disabled'}`);
  console.log('\nRun "tp schedule start" to start the scheduler daemon');
}

/**
 * Remove a schedule
 */
async function removeSchedule(): Promise<void> {
  const manager = new ScheduleManager();
  const schedules = await manager.loadSchedules();

  if (schedules.length === 0) {
    console.log('No schedules found');
    return;
  }

  // Prompt for schedule to remove
  const { scheduleId } = await inquirer.prompt<{ scheduleId: string }>([
    {
      type: 'list',
      name: 'scheduleId',
      message: 'Select schedule to remove:',
      choices: schedules.map((s) => ({
        name: `${s.name ?? s.workflowPath} (${s.cron}) ${s.enabled ? '✓' : '✗'}`,
        value: s.id,
      })),
    },
  ]);

  // Confirm removal
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

  // Remove schedule
  const success = await manager.removeSchedule(scheduleId);

  if (success) {
    console.log('✓ Schedule removed successfully');
  } else {
    console.log('✗ Schedule not found');
  }
}

/**
 * List all schedules
 */
async function listSchedules(): Promise<void> {
  const manager = new ScheduleManager();
  const schedules = await manager.loadSchedules();

  if (schedules.length === 0) {
    console.log('No schedules found');
    console.log('\nRun "tp schedule add" to create a new schedule');
    return;
  }

  console.log('\n📅 Workflow Schedules\n');

  for (const schedule of schedules) {
    const status = schedule.enabled ? '✓ Enabled' : '✗ Disabled';
    const name = schedule.name ?? schedule.workflowPath;
    const lastRun = schedule.lastRun
      ? dayjs(schedule.lastRun).format('YYYY-MM-DD HH:mm:ss')
      : 'Never';

    console.log(`  ${status} ${name}`);
    console.log(`    ID: ${schedule.id}`);
    console.log(`    Cron: ${schedule.cron}`);
    console.log(`    Workflow: ${schedule.workflowPath}`);
    console.log(`    Last run: ${lastRun}`);
    console.log();
  }
}

/**
 * Start the scheduler daemon
 */
async function startScheduler(): Promise<void> {
  const scheduler = new WorkflowScheduler();
  await scheduler.start();

  // Keep process alive
  await new Promise(() => {}); // Infinite promise
}

/**
 * Toggle schedule enabled/disabled
 */
async function toggleSchedule(): Promise<void> {
  const manager = new ScheduleManager();
  const schedules = await manager.loadSchedules();

  if (schedules.length === 0) {
    console.log('No schedules found');
    return;
  }

  // Prompt for schedule to toggle
  const { scheduleId } = await inquirer.prompt<{ scheduleId: string }>([
    {
      type: 'list',
      name: 'scheduleId',
      message: 'Select schedule to toggle:',
      choices: schedules.map((s) => ({
        name: `${s.name ?? s.workflowPath} (${s.cron}) ${s.enabled ? '✓' : '✗'}`,
        value: s.id,
      })),
    },
  ]);

  const schedule = schedules.find((s) => s.id === scheduleId);
  if (!schedule) {
    console.log('✗ Schedule not found');
    return;
  }

  // Toggle
  const newStatus = !schedule.enabled;
  await manager.toggleSchedule(scheduleId, newStatus);

  console.log(
    `✓ Schedule ${newStatus ? 'enabled' : 'disabled'}: ${schedule.name ?? schedule.workflowPath}`
  );
}
