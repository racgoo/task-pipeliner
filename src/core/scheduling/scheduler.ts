import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type {
  ExecutorFactoryPort,
  ExecutorRunOptions,
  SchedulerOutputPort,
} from '@core/execution/ports';
import { getParser } from '@core/parsing/parser';
import type { Schedule } from '@tp-types/schedule';
import cron, { type ScheduledTask } from 'node-cron';
import { getDaemonStatus, isDaemonRunning, removeDaemonPid } from './daemon-manager';
import { ScheduleManager } from './schedule-manager';
import { resolveTimezone } from './timezone-offset';

export interface SchedulerStartOptions {
  onScheduleStarted?: (schedule: Schedule) => void;
}

export interface WorkflowSchedulerDeps {
  executorFactory: ExecutorFactoryPort;
  schedulerOutputPort: SchedulerOutputPort;
  scheduleManager?: ScheduleManager;
}

export class WorkflowScheduler {
  private scheduleManager: ScheduleManager;
  private tasks: Map<string, ScheduledTask> = new Map();
  private startOptions: SchedulerStartOptions | undefined;
  private executorFactory: ExecutorFactoryPort;
  private schedulerOutputPort: SchedulerOutputPort;

  constructor(deps: WorkflowSchedulerDeps) {
    this.scheduleManager = deps.scheduleManager ?? new ScheduleManager();
    this.executorFactory = deps.executorFactory;
    this.schedulerOutputPort = deps.schedulerOutputPort;
  }

  async start(daemonMode: boolean = false, options?: SchedulerStartOptions): Promise<void> {
    this.startOptions = options;

    if (!daemonMode && (await isDaemonRunning())) {
      const status = await getDaemonStatus();
      throw new Error(
        `Scheduler daemon is already running (PID: ${status.pid}). Use "tp schedule stop" to stop it first.`
      );
    }

    this.schedulerOutputPort.showSchedulerStart(daemonMode);

    await this.reload();

    this.schedulerOutputPort.showSchedulerStarted(
      daemonMode,
      process.pid,
      Boolean(process.env.TP_DAEMON_MODE)
    );
  }

  async reload(): Promise<void> {
    this.stop();

    const schedules = await this.scheduleManager.loadSchedules();
    const enabledSchedules = schedules.filter((s) => s.enabled);

    if (enabledSchedules.length === 0) {
      this.schedulerOutputPort.showNoEnabledSchedules();
      return;
    }

    for (const schedule of enabledSchedules) {
      try {
        this.startSchedule(schedule);
      } catch (error) {
        this.schedulerOutputPort.showScheduleStartFailed(schedule.id, error);
      }
    }
  }

  private startSchedule(schedule: Schedule): void {
    if (!cron.validate(schedule.cron)) {
      this.schedulerOutputPort.showInvalidCronExpression(schedule.id, schedule.cron);
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
    } catch (error) {
      this.schedulerOutputPort.showCronScheduleFailed(schedule.id, resolvedTz, error);
      throw error;
    }

    this.tasks.set(schedule.id, task);
    this.startOptions?.onScheduleStarted?.(schedule);
  }

  private async executeSchedule(schedule: Schedule): Promise<void> {
    const name = schedule.name ?? schedule.workflowPath;

    if (!schedule.silent) {
      this.schedulerOutputPort.showScheduledWorkflowStart(name, schedule.profile);
    }

    try {
      const workflowPath = resolve(schedule.workflowPath);
      const parser = getParser(workflowPath);
      const content = await readFile(workflowPath, 'utf-8');
      const workflow = parser.parse(content);

      workflow._filePath = workflowPath;
      workflow._fileName = workflowPath.split(/[/\\]/).pop() ?? 'workflow';

      const executor = this.executorFactory.createExecutor();
      const executeOptions: ExecutorRunOptions = {};

      if (schedule.profile) {
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
        executeOptions.executionVars = { ...profile.var };
      }

      await executor.execute(workflow, executeOptions);
      await this.scheduleManager.updateLastRun(schedule.id);

      if (!schedule.silent) {
        this.schedulerOutputPort.showScheduledWorkflowCompleted(name);
      }
    } catch (error) {
      if (!schedule.silent) {
        this.schedulerOutputPort.showScheduledWorkflowFailed(name, error);
      }
    }
  }

  stop(): void {
    for (const task of this.tasks.values()) {
      task.stop();
    }
    this.tasks.clear();
  }

  async shutdown(daemonMode: boolean): Promise<void> {
    this.schedulerOutputPort.showSchedulerStopping(daemonMode);
    this.stop();
    await removeDaemonPid();
  }

  async stopDaemon(): Promise<boolean> {
    const status = await getDaemonStatus();
    if (!status.running || !status.pid) {
      return false;
    }

    const pid = status.pid;

    try {
      process.kill(pid, 'SIGTERM');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (await isDaemonRunning()) {
        try {
          process.kill(pid, 'SIGKILL');
        } catch {
          // Process might already be dead
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      await removeDaemonPid();
      return true;
    } catch {
      await removeDaemonPid();
      return false;
    }
  }
}
