import { readFile } from 'fs/promises';
import { resolve } from 'path';
import boxen from 'boxen';
import chalk from 'chalk';
import cronstrue from 'cronstrue';
import cron, { ScheduledTask } from 'node-cron';
import { Schedule } from '../types/schedule';
import { getDaemonStatus, isDaemonRunning, removeDaemonPid } from './daemon-manager';
import { Executor } from './executor';
import { getParser } from './parser';
import { ScheduleManager } from './schedule-manager';
import { resolveTimezone } from './timezone-offset';

function getCronDescription(cronExpr: string): string | null {
  try {
    return cronstrue.toString(cronExpr);
  } catch {
    return null;
  }
}

/**
 * WorkflowScheduler
 *
 * Runs as a daemon process to execute workflows based on cron schedules.
 * Monitors ~/.pipeliner/schedules/schedules.json and runs workflows at scheduled times.
 */
export class WorkflowScheduler {
  private scheduleManager: ScheduleManager;
  private tasks: Map<string, ScheduledTask> = new Map();

  constructor() {
    this.scheduleManager = new ScheduleManager();
  }

  /**
   * Start the scheduler daemon
   * Loads schedules and starts cron jobs
   * @param daemonMode - If true, run in background daemon mode
   */
  async start(daemonMode: boolean = false): Promise<void> {
    // Check if daemon is already running
    if (await isDaemonRunning()) {
      const status = await getDaemonStatus();
      throw new Error(
        `Scheduler daemon is already running (PID: ${status.pid}). Use "tp schedule stop" to stop it first.`
      );
    }

    if (daemonMode) {
      console.log('🚀 Starting scheduler daemon in background...');
    } else {
      const header = chalk.bold('🚀 Starting workflow scheduler...');
      console.log(
        `\n${boxen(header, {
          borderStyle: 'round',
          padding: { top: 0, bottom: 0, left: 1, right: 1 },
          margin: { top: 0, bottom: 1, left: 0, right: 0 },
          borderColor: 'cyan',
        })}\n`
      );
    }

    // Load and start all schedules
    await this.reload();

    if (daemonMode) {
      if (!process.env.TP_DAEMON_MODE) {
        const msg = [
          chalk.green('✓ Scheduler daemon started'),
          '',
          chalk.gray(`PID: ${process.pid}`),
          chalk.dim('  tp schedule stop    stop daemon'),
          chalk.dim('  tp schedule status check status'),
        ].join('\n');
        console.log(
          `${boxen(msg, {
            borderStyle: 'round',
            padding: { top: 1, bottom: 1, left: 2, right: 2 },
            borderColor: 'green',
          })}\n`
        );
      }
    } else {
      const footer = [
        chalk.green('✓ Scheduler is running'),
        '',
        chalk.dim('  Press Ctrl+C to stop'),
      ].join('\n');
      console.log(
        `${boxen(footer, {
          borderStyle: 'round',
          padding: { top: 1, bottom: 1, left: 2, right: 2 },
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
          borderColor: 'green',
        })}\n`
      );
    }

    // Setup cleanup handlers
    const cleanup = async () => {
      if (!daemonMode) {
        console.log('\n⏹  Stopping scheduler...');
      }
      this.stop();
      await removeDaemonPid();
      if (!daemonMode) {
        process.exit(0);
      }
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // In daemon mode, detach from terminal
    if (daemonMode) {
      // Redirect stdio to prevent terminal attachment
      process.stdin.destroy();
      // Keep stdout/stderr for logging, but they won't block the process
    }
  }

  /**
   * Reload all schedules
   * Stops existing tasks and starts new ones based on current schedule configuration
   */
  async reload(): Promise<void> {
    // Stop all existing tasks
    this.stop();

    // Load schedules
    const schedules = await this.scheduleManager.loadSchedules();
    const enabledSchedules = schedules.filter((s) => s.enabled);

    if (enabledSchedules.length === 0) {
      console.log(chalk.gray('  No enabled schedules to load.\n'));
      return;
    }

    // Start cron jobs for each enabled schedule
    for (const schedule of enabledSchedules) {
      try {
        this.startSchedule(schedule);
      } catch (error) {
        console.error(chalk.red(`  ✗ Failed to start schedule ${schedule.id}:`), error);
      }
    }
  }

  /**
   * Start a single schedule
   */
  private startSchedule(schedule: Schedule): void {
    if (!cron.validate(schedule.cron)) {
      console.error(`  ✗ Invalid cron expression for schedule ${schedule.id}: ${schedule.cron}`);
      return;
    }

    const options: { timezone?: string } = {};
    const resolvedTz = resolveTimezone(schedule.timezone);
    if (resolvedTz) {
      options.timezone = resolvedTz;
    }

    let task: ScheduledTask;
    try {
      task = cron.schedule(
        schedule.cron,
        async () => {
          await this.executeSchedule(schedule);
        },
        options
      );
    } catch (err) {
      console.error(
        `  ✗ Cron schedule failed for ${schedule.id} (timezone: ${resolvedTz ?? 'local'}).`,
        err instanceof Error ? err.message : err
      );
      throw err;
    }

    this.tasks.set(schedule.id, task);

    const name = schedule.name ?? schedule.workflowPath;
    const cronDesc = getCronDescription(schedule.cron);
    const tzStr = schedule.timezone
      ? schedule.timezone.startsWith('+') || schedule.timezone.startsWith('-')
        ? `UTC${schedule.timezone}`
        : `UTC+${schedule.timezone}`
      : null;

    const rows = [
      [chalk.gray('Cron'), schedule.cron],
      ...(cronDesc ? ([[chalk.gray(''), chalk.dim(`→ ${cronDesc}`)]] as [string, string][]) : []),
      ...(tzStr ? ([[chalk.gray('Timezone'), tzStr]] as [string, string][]) : []),
      [chalk.gray('Workflow'), schedule.workflowPath],
    ];
    const content = [
      `${chalk.green('✓')} ${chalk.bold(name)}`,
      '',
      ...rows.map(([label, value]) => `  ${label.padEnd(10)} ${value}`),
    ].join('\n');

    console.log(
      boxen(content, {
        borderStyle: 'round',
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        margin: { top: 0, bottom: 1, left: 0, right: 0 },
        borderColor: 'green',
      })
    );
  }

  /**
   * Execute a scheduled workflow
   */
  private async executeSchedule(schedule: Schedule): Promise<void> {
    const name = schedule.name ?? schedule.workflowPath;

    if (!schedule.silent) {
      console.log(`\n⏰ Running scheduled workflow: ${name}`);
      console.log(`   Time: ${new Date().toISOString()}`);
      if (schedule.profile) {
        console.log(`   Profile: ${schedule.profile}`);
      }
    }

    try {
      // Resolve workflow path
      const workflowPath = resolve(schedule.workflowPath);

      // Parse workflow
      const parser = getParser(workflowPath);
      const content = await readFile(workflowPath, 'utf-8');
      const workflow = parser.parse(content);

      // Execute workflow with options
      const executor = new Executor();

      // Prepare execution options
      const executeOptions: { profileVars?: Record<string, string> } = {};

      if (schedule.profile) {
        // Find and apply profile
        if (!workflow.profiles) {
          throw new Error(
            `Profile "${schedule.profile}" not found: no profiles defined in workflow`
          );
        }
        const profile = workflow.profiles.find((p) => p.name === schedule.profile);
        if (!profile) {
          throw new Error(
            `Profile "${schedule.profile}" not found. Available profiles: ${workflow.profiles.map((p) => p.name).join(', ')}`
          );
        }
        executeOptions.profileVars = profile.var;
      }

      await executor.execute(workflow, executeOptions);

      // Update last run time
      await this.scheduleManager.updateLastRun(schedule.id);

      if (!schedule.silent) {
        console.log(`✓ Scheduled workflow completed: ${name}\n`);
      }
    } catch (error) {
      if (!schedule.silent) {
        console.error(`✗ Scheduled workflow failed: ${name}`);
        console.error(`  Error: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stop(): void {
    for (const task of this.tasks.values()) {
      task.stop();
    }
    this.tasks.clear();
  }

  /**
   * Stop the daemon process
   */
  async stopDaemon(): Promise<boolean> {
    const status = await getDaemonStatus();
    if (!status.running || !status.pid) {
      return false;
    }

    const pid = status.pid;

    try {
      // Send SIGTERM to the daemon process
      process.kill(pid, 'SIGTERM');

      // Wait a bit for graceful shutdown
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if process is still running
      if (await isDaemonRunning()) {
        // Force kill if still running
        try {
          process.kill(pid, 'SIGKILL');
        } catch {
          // Process might already be dead
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Clean up PID file
      await removeDaemonPid();
      return true;
    } catch {
      // Process might already be dead
      await removeDaemonPid();
      return false;
    }
  }
}
