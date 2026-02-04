import { existsSync } from 'fs';
import { dirname, isAbsolute, resolve } from 'path';
import { Command } from 'commander';
import dayjs from 'dayjs';
import inquirer from 'inquirer';
import cron from 'node-cron';
import { parseScheduleFile } from '../core/schedule-file-parser';
import { ScheduleManager } from '../core/schedule-manager';
import { WorkflowScheduler } from '../core/scheduler';
import { ScheduleDefinition } from '../types/schedule-file';

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
    .description('Add schedules from a schedule file (YAML or JSON)')
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
 * Resolve workflow path relative to schedule file or baseDir
 */
function resolveWorkflowPath(scheduleFilePath: string, scheduleDef: ScheduleDefinition): string {
  const workflow = scheduleDef.workflow;

  // If absolute path, use as-is
  if (isAbsolute(workflow)) {
    return workflow;
  }

  // Determine base directory
  const baseDir = scheduleDef.baseDir ? resolve(scheduleDef.baseDir) : dirname(scheduleFilePath);

  // Resolve relative to base directory
  return resolve(baseDir, workflow);
}

/**
 * Add schedules from a schedule file
 */
async function addSchedules(scheduleFilePath?: string): Promise<void> {
  const manager = new ScheduleManager();

  // Prompt for schedule file path if not provided
  if (!scheduleFilePath) {
    const { path } = await inquirer.prompt<{ path: string }>([
      {
        type: 'input',
        name: 'path',
        message: 'Schedule file path (YAML or JSON):',
        validate: (input: string) => {
          const resolved = resolve(input);
          if (!existsSync(resolved)) {
            return `File not found: ${resolved}`;
          }
          return true;
        },
      },
    ]);
    scheduleFilePath = path;
  }

  const resolvedPath = resolve(scheduleFilePath);

  // Check if file exists
  if (!existsSync(resolvedPath)) {
    console.error(`✗ File not found: ${resolvedPath}`);
    process.exit(1);
  }

  // Parse schedule file
  let scheduleFile;
  try {
    scheduleFile = await parseScheduleFile(resolvedPath);
  } catch (error) {
    console.error(
      `✗ Failed to parse schedule file: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }

  // Validate cron expressions
  const invalidCrons = scheduleFile.schedules.filter((s) => !cron.validate(s.cron));
  if (invalidCrons.length > 0) {
    console.error('✗ Invalid cron expression(s):');
    for (const s of invalidCrons) {
      console.error(`  - ${s.name}: "${s.cron}"`);
    }
    process.exit(1);
  }

  // Check workflow files exist
  const missingWorkflows = scheduleFile.schedules.filter((s) => {
    const workflowPath = resolveWorkflowPath(resolvedPath, s);
    return !existsSync(workflowPath);
  });
  if (missingWorkflows.length > 0) {
    console.error('✗ Workflow file(s) not found:');
    for (const s of missingWorkflows) {
      const resolvedWorkflowPath = resolveWorkflowPath(resolvedPath, s);
      console.error(`  - ${s.name}: ${s.workflow} (resolved: ${resolvedWorkflowPath})`);
    }
    process.exit(1);
  }

  // Prompt for alias override for each schedule
  console.log(`\nFound ${scheduleFile.schedules.length} schedule(s) in file.\n`);

  const addedSchedules = [];
  for (const scheduleDef of scheduleFile.schedules) {
    // Ask for alias (default to name from file)
    const { alias } = await inquirer.prompt<{ alias: string }>([
      {
        type: 'input',
        name: 'alias',
        message: `Alias for "${scheduleDef.name}" (press Enter to use as-is):`,
        default: scheduleDef.name,
      },
    ]);

    // Add schedule
    const schedule = await manager.addSchedule({
      name: alias,
      workflowPath: resolveWorkflowPath(resolvedPath, scheduleDef),
      cron: scheduleDef.cron,
      enabled: true, // Always enabled by default
      silent: scheduleDef.silent,
      profile: scheduleDef.profile,
    });

    addedSchedules.push(schedule);
  }

  console.log(`\n✓ Added ${addedSchedules.length} schedule(s) successfully\n`);
  for (const s of addedSchedules) {
    console.log(`  - ${s.name ?? 'N/A'}`);
    console.log(`    Cron: ${s.cron}`);
    console.log(`    Workflow: ${s.workflowPath}`);
    if (s.silent) console.log(`    Silent: Yes`);
    if (s.profile) console.log(`    Profile: ${s.profile}`);
    console.log(`    Status: ${s.enabled ? 'Enabled' : 'Disabled'}`);
    console.log();
  }
  console.log('Run "tp schedule start" to start the scheduler daemon');
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

/**
 * Remove all schedules
 */
async function removeAllSchedules(): Promise<void> {
  const manager = new ScheduleManager();
  const schedules = await manager.loadSchedules();

  if (schedules.length === 0) {
    console.log('No schedules found');
    return;
  }

  // Confirm removal
  const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to remove all ${schedules.length} schedule(s)?`,
      default: false,
    },
  ]);

  if (!confirm) {
    console.log('Cancelled');
    return;
  }

  // Remove all schedules
  await manager.saveSchedules([]);

  console.log(`✓ Removed all ${schedules.length} schedule(s)`);
}
