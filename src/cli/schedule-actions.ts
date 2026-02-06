import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { basename, dirname, extname, isAbsolute, join, resolve } from 'path';
import boxen from 'boxen';
import chalk from 'chalk';
import inquirer from 'inquirer';
import cron from 'node-cron';
import {
  getDaemonErrorLogPath,
  getDaemonStatus,
  isDaemonRunning,
  readDaemonErrorLog,
  writeDaemonError,
} from '../core/daemon-manager';
import { parseScheduleFile } from '../core/schedule-file-parser';
import { ScheduleManager } from '../core/schedule-manager';
import { WorkflowScheduler } from '../core/scheduler';
import { Schedule } from '../types/schedule';
import { ScheduleDefinition } from '../types/schedule-file';
import { ChoicePrompt } from './prompts';
import { formatScheduleCard, getCronDescription } from './schedule-card-format';
import { findNearestTpDirectory } from './utils';

/**
 * Resolve workflow path relative to schedule file or baseDir
 */
export function resolveWorkflowPath(
  scheduleFilePath: string,
  scheduleDef: ScheduleDefinition
): string {
  const workflow = scheduleDef.workflow;

  if (isAbsolute(workflow)) {
    return workflow;
  }

  const baseDir = scheduleDef.baseDir ? resolve(scheduleDef.baseDir) : dirname(scheduleFilePath);
  return resolve(baseDir, workflow);
}

/**
 * Build rich label for schedule (alias · filename · cron · human description · status)
 * @param statusStyle - 'plain' = ✓/✗ (remove list), 'color' = colored "Enabled"/"Disabled" (toggle list)
 */
export function scheduleChoiceLabel(s: Schedule, statusStyle: 'plain' | 'color' = 'plain'): string {
  const alias = s.name ?? '(no alias)';
  const filename = basename(s.workflowPath);
  const human = getCronDescription(s.cron) ?? s.cron;
  const status =
    statusStyle === 'color'
      ? s.enabled
        ? chalk.green('Enabled')
        : chalk.dim('Disabled')
      : s.enabled
        ? '✓'
        : '✗';
  return `${alias} · ${filename} · ${s.cron} · ${human} · ${status}`;
}

/**
 * Add schedules from a schedule file
 */
export async function addSchedules(scheduleFilePath?: string): Promise<void> {
  const manager = new ScheduleManager();

  if (!scheduleFilePath) {
    const tpDir = findNearestTpDirectory();
    if (!tpDir) {
      console.error(chalk.red('\n✗ No tp directory found'));
      process.exit(1);
    }
    const schedulesDir = join(tpDir, 'schedules');
    if (!existsSync(schedulesDir)) {
      console.error(chalk.red(`\n✗ No schedules directory found at ${schedulesDir}`));
      process.exit(1);
    }
    const files = await readdir(schedulesDir);
    const scheduleFiles = files.filter((file) => {
      const ext = extname(file).toLowerCase();
      return ['.yaml', '.yml', '.json'].includes(ext);
    });
    if (scheduleFiles.length === 0) {
      console.error(chalk.red(`\n✗ No schedule files found in ${schedulesDir}`));
      process.exit(1);
    }
    const choices = scheduleFiles.map((file) => ({
      id: join(schedulesDir, file),
      label: file,
    }));
    const choicePrompt = new ChoicePrompt(true);
    const selected = await choicePrompt.prompt('Select a schedule file to add', choices);
    scheduleFilePath = selected.id;
  }

  const resolvedPath = resolve(scheduleFilePath);

  if (!existsSync(resolvedPath)) {
    console.error(`✗ File not found: ${resolvedPath}`);
    process.exit(1);
  }

  let scheduleFile;
  try {
    scheduleFile = await parseScheduleFile(resolvedPath);
  } catch (error) {
    console.error(
      `✗ Failed to parse schedule file: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }

  const invalidCrons = scheduleFile.schedules.filter((s) => !cron.validate(s.cron));
  if (invalidCrons.length > 0) {
    console.error('✗ Invalid cron expression(s):');
    for (const s of invalidCrons) {
      console.error(`  - ${s.name}: "${s.cron}"`);
    }
    process.exit(1);
  }

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

  console.log(`\nFound ${scheduleFile.schedules.length} schedule(s) in file.\n`);

  const addedSchedules = [];
  for (const scheduleDef of scheduleFile.schedules) {
    const { alias } = await inquirer.prompt<{ alias: string }>([
      {
        type: 'input',
        name: 'alias',
        message: `Alias for "${scheduleDef.name}" (press Enter to use as-is):`,
        default: scheduleDef.name,
      },
    ]);

    const schedule = await manager.addSchedule({
      name: alias,
      workflowPath: resolveWorkflowPath(resolvedPath, scheduleDef),
      cron: scheduleDef.cron,
      enabled: true,
      timezone: scheduleDef.timezone,
      silent: scheduleDef.silent,
      profile: scheduleDef.profile,
    });

    addedSchedules.push(schedule);
  }

  const daemonStatus = await getDaemonStatus();
  console.log(`\n✓ Added ${addedSchedules.length} schedule(s) successfully\n`);
  for (const s of addedSchedules) {
    console.log(formatScheduleCard(s, { daemonRunning: daemonStatus.running }));
  }
  console.log(chalk.dim('  Tip: Run "tp schedule start" to start the scheduler daemon'));
}

/**
 * Remove a schedule
 */
export async function removeSchedule(): Promise<void> {
  const manager = new ScheduleManager();
  const schedules = await manager.loadSchedules();

  if (schedules.length === 0) {
    console.log('No schedules found');
    return;
  }

  const choices = schedules.map((s) => ({
    id: s.id,
    label: scheduleChoiceLabel(s),
  }));
  const choicePrompt = new ChoicePrompt(true);
  const selected = await choicePrompt.prompt('Select schedule to remove:', choices);
  const scheduleId = selected.id;
  const scheduleToRemove = schedules.find((s) => s.id === scheduleId);

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

  const success = await manager.removeSchedule(scheduleId);

  if (success && scheduleToRemove) {
    const daemonStatus = await getDaemonStatus();
    console.log('\n✓ Schedule removed\n');
    console.log(formatScheduleCard(scheduleToRemove, { daemonRunning: daemonStatus.running }));
  } else if (success) {
    console.log('✓ Schedule removed successfully');
  } else {
    console.log('✗ Schedule not found');
  }
}

/**
 * List all schedules (rich table-style UI)
 */
export async function listSchedules(): Promise<void> {
  const manager = new ScheduleManager();
  const schedules = await manager.loadSchedules();

  if (schedules.length === 0) {
    const emptyMsg = [
      chalk.gray('No schedules registered.'),
      '',
      chalk.dim('  tp schedule add <schedule.yaml>   add from a schedule file'),
    ].join('\n');
    console.log(
      `\n${boxen(emptyMsg, {
        borderStyle: 'round',
        padding: { top: 1, bottom: 1, left: 2, right: 2 },
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        borderColor: 'gray',
      })}\n`
    );
    return;
  }

  const daemonStatus = await getDaemonStatus();
  const daemonBadge = daemonStatus.running ? chalk.green('● running') : chalk.gray('○ stopped');
  const enabledCount = schedules.filter((s) => s.enabled).length;
  const title = chalk.bold('📅 Workflow Schedules');
  console.log(title);
  console.log(
    [
      chalk.gray('  Daemon: '),
      daemonBadge,
      chalk.gray(`  ·  Schedules: ${enabledCount}/${schedules.length} enabled`),
    ].join('')
  );

  for (const s of schedules) {
    console.log(formatScheduleCard(s, { daemonRunning: daemonStatus.running }));
  }

  console.log(
    chalk.dim(
      '  Tip: tp schedule start — run scheduler daemon; tp schedule status — view live status'
    )
  );
}

/**
 * Start the scheduler daemon
 */
export async function startScheduler(daemonMode: boolean): Promise<void> {
  if (await isDaemonRunning()) {
    const status = await getDaemonStatus();
    console.error(`✗ Scheduler daemon is already running (PID: ${status.pid})`);
    console.error('  Run "tp schedule stop" to stop it first');
    process.exit(1);
  }

  if (daemonMode) {
    if (process.env.TP_DAEMON_MODE === 'true') {
      try {
        const { saveDaemonPid } = await import('../core/daemon-manager');
        await saveDaemonPid();

        const scheduler = new WorkflowScheduler();
        await scheduler.start(true);

        await new Promise(() => {});
      } catch (err) {
        await writeDaemonError(err instanceof Error ? err : new Error(String(err)));
        process.exit(1);
      }
    } else {
      const args = process.argv.slice(1);
      const child = spawn(process.argv[0], args, {
        detached: true,
        stdio: 'ignore',
        env: {
          ...process.env,
          TP_DAEMON_MODE: 'true',
        },
      });

      child.unref();

      const maxAttempts = 3;
      const delayMs = 800;
      let running = false;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        if (await isDaemonRunning()) {
          running = true;
          break;
        }
      }

      if (running) {
        const status = await getDaemonStatus();
        console.log(`✓ Scheduler daemon started in background (PID: ${status.pid})`);
        console.log('  Run "tp schedule stop" to stop the daemon');
        console.log('  Run "tp schedule status" to check daemon status');
      } else {
        console.error('✗ Failed to start scheduler daemon');
        const errLog = await readDaemonErrorLog();
        if (errLog) {
          console.error(chalk.dim('  Last error from daemon:'));
          console.error(
            chalk.red(
              errLog
                .split('\n')
                .map((l) => `  ${l}`)
                .join('\n')
            )
          );
        } else {
          console.error(chalk.dim(`  Check ${getDaemonErrorLogPath()} for details`));
        }
        process.exit(1);
      }

      process.exit(0);
    }
  } else {
    const scheduler = new WorkflowScheduler();
    await scheduler.start(false, {
      onScheduleStarted: (s) => console.log(formatScheduleCard(s, { daemonRunning: true })),
    });

    await new Promise(() => {});
  }
}

/**
 * Stop the scheduler daemon
 */
export async function stopScheduler(): Promise<void> {
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
 * Toggle schedule enabled/disabled
 */
export async function toggleSchedule(): Promise<void> {
  const manager = new ScheduleManager();
  const schedules = await manager.loadSchedules();

  if (schedules.length === 0) {
    console.log('No schedules found');
    return;
  }

  const choices = schedules.map((s) => ({
    id: s.id,
    label: scheduleChoiceLabel(s, 'color'),
  }));
  const choicePrompt = new ChoicePrompt(true);
  const selected = await choicePrompt.prompt('Select schedule to toggle:', choices);
  const scheduleId = selected.id;

  const schedule = schedules.find((s) => s.id === scheduleId);
  if (!schedule) {
    console.log('✗ Schedule not found');
    return;
  }

  const newStatus = !schedule.enabled;
  await manager.toggleSchedule(scheduleId, newStatus);

  const daemonStatus = await getDaemonStatus();
  const updated = { ...schedule, enabled: newStatus };

  const statusLabel = newStatus ? chalk.bold.green('ENABLED') : chalk.bold.gray('DISABLED');
  const statusHint = newStatus
    ? chalk.dim(' (will run at the times shown below)')
    : chalk.dim(' (will not run until you enable it again)');
  console.log(`\n✓ Schedule is now ${statusLabel}${statusHint}\n`);
  console.log(
    formatScheduleCard(updated, { daemonRunning: daemonStatus.running, emphasizeState: true })
  );
}

/**
 * Remove all schedules
 */
export async function removeAllSchedules(): Promise<void> {
  const manager = new ScheduleManager();
  const schedules = await manager.loadSchedules();

  if (schedules.length === 0) {
    console.log('No schedules found');
    return;
  }

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

  await manager.saveSchedules([]);

  console.log(`✓ Removed all ${schedules.length} schedule(s)`);
}
