import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { dirname, isAbsolute, resolve } from 'path';
import boxen from 'boxen';
import chalk from 'chalk';
import { Command } from 'commander';
import dayjs from 'dayjs';
import inquirer from 'inquirer';
import logUpdate from 'log-update';
import cron from 'node-cron';
import { getDaemonStatus, isDaemonRunning } from '../core/daemon-manager';
import { parseScheduleFile } from '../core/schedule-file-parser';
import { ScheduleManager } from '../core/schedule-manager';
import { WorkflowScheduler } from '../core/scheduler';
import { Schedule } from '../types/schedule';
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

  // Status subcommand
  scheduleCmd
    .command('status')
    .description('Check scheduler daemon status (real-time mode, press Ctrl+C to exit)')
    .action(async () => {
      await showSchedulerStatus(true);
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
      timezone: scheduleDef.timezone,
      silent: scheduleDef.silent,
      profile: scheduleDef.profile,
    });

    addedSchedules.push(schedule);
  }

  console.log(`\n✓ Added ${addedSchedules.length} schedule(s) successfully\n`);
  for (const s of addedSchedules) {
    console.log(`  - ${s.name ?? 'N/A'}`);
    console.log(`    Cron: ${s.cron}`);
    if (s.timezone) console.log(`    Timezone: ${s.timezone}`);
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
    if (schedule.timezone) {
      console.log(`    Timezone: ${schedule.timezone}`);
    }
    console.log(`    Workflow: ${schedule.workflowPath}`);
    console.log(`    Last run: ${lastRun}`);
    console.log();
  }
}

/**
 * Start the scheduler daemon
 */
async function startScheduler(daemonMode: boolean): Promise<void> {
  // Check if daemon is already running
  if (await isDaemonRunning()) {
    const status = await getDaemonStatus();
    console.error(`✗ Scheduler daemon is already running (PID: ${status.pid})`);
    console.error('  Run "tp schedule stop" to stop it first');
    process.exit(1);
  }

  if (daemonMode) {
    // Check if we're already in daemon mode (via environment variable)
    if (process.env.TP_DAEMON_MODE === 'true') {
      // We're the daemon process, start normally
      // Save PID and start time immediately (before scheduler starts)
      const { saveDaemonPid } = await import('../core/daemon-manager');
      await saveDaemonPid();

      const scheduler = new WorkflowScheduler();
      await scheduler.start(true);

      // Keep process alive
      await new Promise(() => {}); // Infinite promise
    } else {
      // Spawn a new daemon process
      const args = process.argv.slice(1); // Remove node/script path, keep rest
      const child = spawn(process.argv[0], args, {
        detached: true,
        stdio: 'ignore',
        env: {
          ...process.env,
          TP_DAEMON_MODE: 'true',
        },
      });

      // Unref the child process so parent can exit
      child.unref();

      // Give it a moment to start and save PID
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if it started successfully
      if (await isDaemonRunning()) {
        const status = await getDaemonStatus();
        console.log(`✓ Scheduler daemon started in background (PID: ${status.pid})`);
        console.log('  Run "tp schedule stop" to stop the daemon');
        console.log('  Run "tp schedule status" to check daemon status');
      } else {
        console.error('✗ Failed to start scheduler daemon');
        process.exit(1);
      }

      // Exit parent process
      process.exit(0);
    }
  } else {
    // Foreground mode
    const scheduler = new WorkflowScheduler();
    await scheduler.start(false);

    // Keep process alive
    await new Promise(() => {}); // Infinite promise
  }
}

/**
 * Stop the scheduler daemon
 */
async function stopScheduler(): Promise<void> {
  const status = await getDaemonStatus();

  if (!status.running) {
    console.log('Scheduler daemon is not running');
    return;
  }

  console.log(`Stopping scheduler daemon (PID: ${status.pid})...`);

  const scheduler = new WorkflowScheduler();
  const stopped = await scheduler.stopDaemon();

  if (stopped) {
    console.log('✓ Scheduler daemon stopped');
  } else {
    console.log('✗ Failed to stop scheduler daemon (process may have already exited)');
  }
}

/**
 * Format duration in human-readable format
 */
function formatUptime(startTime: string | null): string {
  if (!startTime) return 'Unknown';
  const start = dayjs(startTime);
  const now = dayjs();
  const diff = now.diff(start, 'second');

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

/**
 * Format schedule status for display
 */
function formatScheduleStatus(schedule: Schedule): string {
  const name = schedule.name ?? schedule.workflowPath;
  const status = schedule.enabled ? chalk.green('● active') : chalk.gray('○ inactive');
  const lastRun = schedule.lastRun
    ? dayjs(schedule.lastRun).format('YYYY-MM-DD HH:mm:ss')
    : chalk.gray('never');
  const profile = schedule.profile ? chalk.cyan(` [profile: ${schedule.profile}]`) : '';
  const silent = schedule.silent ? chalk.gray(' [silent]') : '';

  const lines = [
    `${status} ${chalk.bold(name)}${profile}${silent}`,
    `${chalk.gray('Cron:')} ${schedule.cron}`,
  ];
  if (schedule.timezone) {
    lines.push(`${chalk.gray('Timezone:')} ${schedule.timezone}`);
  }
  lines.push(`${chalk.gray('Last run:')} ${lastRun}`);

  const content = lines.join('\n');

  return boxen(content, {
    borderStyle: 'round',
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    margin: { top: 0, bottom: 1, left: 0, right: 0 },
    borderColor: schedule.enabled ? 'green' : 'gray',
  });
}

/**
 * Generate status display content
 */
async function generateStatusDisplay(): Promise<string> {
  const status = await getDaemonStatus();
  const manager = new ScheduleManager();
  const schedules = await manager.loadSchedules();

  const sections: string[] = [];

  // Daemon status section with boxen
  let daemonContent: string;
  if (status.running && status.pid) {
    const uptime = formatUptime(status.startTime);
    const startTime = status.startTime
      ? dayjs(status.startTime).format('YYYY-MM-DD HH:mm:ss')
      : 'Unknown';

    daemonContent = [
      `${chalk.green('●')} ${chalk.green('active')} ${chalk.gray('(running)')}`,
      '',
      `${chalk.gray('Loaded:')} ${chalk.white(startTime)}`,
      `${chalk.gray('Active:')} ${chalk.green('active (running)')} since ${chalk.white(startTime)}`,
      `${chalk.gray('PID:')} ${chalk.white(status.pid.toString())}`,
      `${chalk.gray('Uptime:')} ${chalk.white(uptime)}`,
    ].join('\n');
  } else {
    daemonContent = [
      `${chalk.red('●')} ${chalk.red('inactive')} ${chalk.gray('(dead)')}`,
      '',
      `${chalk.gray('Loaded:')} ${chalk.gray('not found')}`,
      `${chalk.gray('Active:')} ${chalk.red('inactive (dead)')}`,
    ].join('\n');
  }

  const daemonBox = boxen(daemonContent, {
    title: chalk.bold('task-pipeliner-scheduler.service'),
    titleAlignment: 'left',
    borderStyle: 'round',
    padding: { top: 1, bottom: 1, left: 2, right: 2 },
    margin: { top: 0, bottom: 1, left: 0, right: 0 },
    borderColor: status.running ? 'green' : 'red',
  });

  sections.push(daemonBox);

  // Schedules section
  if (schedules.length > 0) {
    const enabledCount = schedules.filter((s) => s.enabled).length;
    const schedulesHeader = chalk.bold(`Schedules: ${enabledCount}/${schedules.length} active`);
    sections.push(schedulesHeader);
    sections.push('');

    for (const schedule of schedules) {
      sections.push(formatScheduleStatus(schedule));
    }
  } else {
    const noSchedulesBox = boxen(chalk.gray('No schedules configured'), {
      borderStyle: 'round',
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      borderColor: 'gray',
    });
    sections.push(noSchedulesBox);
  }

  return sections.join('\n');
}

/**
 * Show scheduler daemon status
 */
async function showSchedulerStatus(follow: boolean): Promise<void> {
  if (follow) {
    // Real-time follow mode
    let running = true;

    // Handle Ctrl+C
    const cleanup = () => {
      running = false;
      logUpdate.done();
      process.exit(0);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Update every second
    const updateInterval = setInterval(async () => {
      if (!running) {
        clearInterval(updateInterval);
        return;
      }

      try {
        const display = await generateStatusDisplay();
        const status = await getDaemonStatus();
        const footer = status.running
          ? chalk.gray('\nPress Ctrl+C to exit (daemon will continue running)')
          : chalk.gray('\nRun "tp schedule start -d" to start the daemon');
        logUpdate(`${display}${footer}`);
      } catch (error) {
        logUpdate.done();
        console.error('Error updating status:', error);
        clearInterval(updateInterval);
        process.exit(1);
      }
    }, 1000);

    // Initial display
    const initialDisplay = await generateStatusDisplay();
    const status = await getDaemonStatus();
    const footer = status.running
      ? chalk.gray('\nPress Ctrl+C to exit (daemon will continue running)')
      : chalk.gray('\nRun "tp schedule start -d" to start the daemon');
    logUpdate(`${initialDisplay}${footer}`);

    // Keep running until interrupted
    await new Promise(() => {});
  } else {
    // One-time display
    const display = await generateStatusDisplay();
    const status = await getDaemonStatus();
    const footer = status.running
      ? ''
      : chalk.gray('\nRun "tp schedule start -d" to start the daemon');
    console.log(`\n${display}${footer}\n`);
  }
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
