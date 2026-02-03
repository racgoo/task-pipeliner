import { readFile } from 'fs/promises';
import { resolve } from 'path';
import cron, { ScheduledTask } from 'node-cron';
import { Schedule } from '../types/schedule';
import { Executor } from './executor';
import { getParser } from './parser';
import { ScheduleManager } from './schedule-manager';

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
   */
  async start(): Promise<void> {
    console.log('🚀 Starting workflow scheduler...');

    // Load and start all schedules
    await this.reload();

    console.log('✓ Scheduler is running');
    console.log('  Press Ctrl+C to stop');

    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n⏹  Stopping scheduler...');
      this.stop();
      process.exit(0);
    });
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
      console.log('  No active schedules found');
      return;
    }

    console.log(`  Loading ${enabledSchedules.length} schedule(s)...`);

    // Start cron jobs for each enabled schedule
    for (const schedule of enabledSchedules) {
      try {
        this.startSchedule(schedule);
      } catch (error) {
        console.error(`  ✗ Failed to start schedule ${schedule.id}:`, error);
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

    const task = cron.schedule(schedule.cron, async () => {
      await this.executeSchedule(schedule);
    });

    this.tasks.set(schedule.id, task);

    const name = schedule.name ?? schedule.workflowPath;
    console.log(`  ✓ Scheduled: ${name}`);
    console.log(`    Cron: ${schedule.cron}`);
    console.log(`    Workflow: ${schedule.workflowPath}`);
  }

  /**
   * Execute a scheduled workflow
   */
  private async executeSchedule(schedule: Schedule): Promise<void> {
    const name = schedule.name ?? schedule.workflowPath;
    console.log(`\n⏰ Running scheduled workflow: ${name}`);
    console.log(`   Time: ${new Date().toISOString()}`);

    try {
      // Resolve workflow path
      const workflowPath = resolve(schedule.workflowPath);

      // Parse workflow
      const parser = getParser(workflowPath);
      const content = await readFile(workflowPath, 'utf-8');
      const workflow = parser.parse(content);

      // Execute workflow
      const executor = new Executor();

      await executor.execute(workflow);

      // Update last run time
      await this.scheduleManager.updateLastRun(schedule.id);

      console.log(`✓ Scheduled workflow completed: ${name}\n`);
    } catch (error) {
      console.error(`✗ Scheduled workflow failed: ${name}`);
      console.error(`  Error: ${error instanceof Error ? error.message : String(error)}\n`);
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
}
