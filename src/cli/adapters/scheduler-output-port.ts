import type { SchedulerOutputPort } from '@core/execution/ports';
import { uiBox as boxen, uiText as chalk } from '@ui/primitives';

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
        const message = [
          chalk.green('✓ Scheduler daemon started'),
          '',
          chalk.gray(`PID: ${pid}`),
          chalk.dim('  tp schedule stop    stop daemon'),
          chalk.dim('  tp schedule status check status'),
        ].join('\n');

        console.log(
          `${boxen(message, {
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

export function createCliSchedulerOutputPort(): SchedulerOutputPort {
  return new CliSchedulerOutputPort();
}
