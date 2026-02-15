import { Executor } from '@core/execution/executor';
import type {
  ExecutionOutputPort,
  ExecutorFactoryPort,
  PromptOption,
  PromptPort,
  SchedulerOutputPort,
  TaskRunHeaderOptions,
  TaskRunOutputPort,
} from '@core/execution/ports';
import { WorkflowScheduler } from '@core/scheduling/scheduler';
import type { History } from '@tp-types/workflow';
import {
  createErrorBox,
  createParallelFooterMessage,
  createParallelHeaderBox,
  createStepFooterMessage,
  createStepHeaderBox,
  formatDuration,
  formatNestedLine,
} from '@ui/index';
import boxen from 'boxen';
import chalk from 'chalk';
import { ChoicePrompt, TextPrompt } from './prompts';
import { generateTimeline } from './timeline/index';

class CliPromptPort implements PromptPort {
  private choicePrompt = new ChoicePrompt();
  private textPrompt = new TextPrompt();

  async choose(message: string, options: PromptOption[]): Promise<PromptOption> {
    return this.choicePrompt.prompt(message, options);
  }

  async text(message: string, defaultValue?: string): Promise<string> {
    return this.textPrompt.prompt(message, defaultValue);
  }
}

class CliExecutionOutputPort implements ExecutionOutputPort {
  showStepFooter(success: boolean, durationMs: number): void {
    const footerMessage = createStepFooterMessage(success, false, durationMs);
    console.log(footerMessage);
  }

  showTotalExecutionTime(durationMs: number): void {
    const totalDurationStr = formatDuration(durationMs);
    console.log(chalk.cyan(`\nTotal execution time: ${totalDurationStr}`));
  }

  showTimeline(history: History): void {
    const timeline = generateTimeline(history);
    if (timeline) {
      console.log(timeline);
    }
  }
}

class CliTaskRunOutputPort implements TaskRunOutputPort {
  createStepHeaderBox(
    content: string,
    lineNumber?: number,
    fileName?: string,
    options: TaskRunHeaderOptions = {}
  ): string {
    return createStepHeaderBox(content, lineNumber, fileName, options);
  }

  createStepFooterMessage(success: boolean, isNested?: boolean, durationMs?: number): string {
    return createStepFooterMessage(success, isNested, durationMs);
  }

  createErrorBox(error: string): string {
    return createErrorBox(error);
  }

  formatNestedLine(line: string, isNested?: boolean): string {
    return formatNestedLine(line, isNested);
  }

  createParallelHeaderBox(branchCount: number): string {
    return createParallelHeaderBox(branchCount);
  }

  createParallelFooterMessage(allSucceeded: boolean): string {
    return createParallelFooterMessage(allSucceeded);
  }
}

class CliSchedulerOutputPort implements SchedulerOutputPort {
  showSchedulerStart(daemonMode: boolean): void {
    if (daemonMode) {
      console.log('🚀 Starting scheduler daemon in background...');
      return;
    }

    const header = chalk.bold('🚀 Starting workflow scheduler...');
    console.log(
      boxen(header, {
        borderStyle: 'round',
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        borderColor: 'cyan',
      })
    );
  }

  showSchedulerStarted(daemonMode: boolean, pid: number, daemonChild: boolean): void {
    if (daemonMode) {
      if (!daemonChild) {
        const msg = [
          chalk.green('✓ Scheduler daemon started'),
          '',
          chalk.gray(`PID: ${pid}`),
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
      return;
    }

    const footer = [
      chalk.green('✓ Scheduler is running'),
      chalk.dim('  Press Ctrl+C to stop'),
    ].join('\n');
    console.log(
      boxen(footer, {
        borderStyle: 'round',
        padding: { top: 0, bottom: 0, left: 2, right: 2 },
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        borderColor: 'green',
      })
    );
  }

  showSchedulerStopping(daemonMode: boolean): void {
    if (!daemonMode) {
      console.log('\n⏹  Stopping scheduler...');
    }
  }

  showNoEnabledSchedules(): void {
    console.log(chalk.gray('  No enabled schedules to load.\n'));
  }

  showScheduleStartFailed(scheduleId: string, error: unknown): void {
    console.error(chalk.red(`  ✗ Failed to start schedule ${scheduleId}:`), error);
  }

  showInvalidCronExpression(scheduleId: string, cronExpression: string): void {
    console.error(`  ✗ Invalid cron expression for schedule ${scheduleId}: ${cronExpression}`);
  }

  showCronScheduleFailed(scheduleId: string, timezone: string | undefined, error: unknown): void {
    console.error(
      `  ✗ Cron schedule failed for ${scheduleId} (timezone: ${timezone ?? 'local'}).`,
      error instanceof Error ? error.message : error
    );
  }

  showScheduledWorkflowStart(name: string, profile?: string): void {
    console.log(`\n⏰ Running scheduled workflow: ${name}`);
    console.log(`   Time: ${new Date().toISOString()}`);
    if (profile) {
      console.log(`   Profile: ${profile}`);
    }
  }

  showScheduledWorkflowCompleted(name: string): void {
    console.log(`✓ Scheduled workflow completed: ${name}\n`);
  }

  showScheduledWorkflowFailed(name: string, error: unknown): void {
    console.error(`✗ Scheduled workflow failed: ${name}`);
    console.error(`  Error: ${error instanceof Error ? error.message : String(error)}\n`);
  }
}

export function createCliPromptPort(): PromptPort {
  return new CliPromptPort();
}

export function createCliExecutionOutputPort(): ExecutionOutputPort {
  return new CliExecutionOutputPort();
}

export function createCliTaskRunOutputPort(): TaskRunOutputPort {
  return new CliTaskRunOutputPort();
}

export function createCliSchedulerOutputPort(): SchedulerOutputPort {
  return new CliSchedulerOutputPort();
}

export function createCliExecutor(): Executor {
  return new Executor({
    promptPort: createCliPromptPort(),
    executionOutputPort: createCliExecutionOutputPort(),
    taskRunOutputPort: createCliTaskRunOutputPort(),
  });
}

export function createCliExecutorFactory(): ExecutorFactoryPort {
  return {
    createExecutor: () => createCliExecutor(),
  };
}

export function createCliScheduler(): WorkflowScheduler {
  return new WorkflowScheduler({
    executorFactory: createCliExecutorFactory(),
    schedulerOutputPort: createCliSchedulerOutputPort(),
  });
}
