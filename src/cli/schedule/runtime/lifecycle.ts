import type { WorkflowScheduler } from '@core/scheduling/scheduler';

export interface SchedulerLifecycleOptions {
  scheduler: WorkflowScheduler;
  daemonMode: boolean;
}

export async function waitForSchedulerShutdownSignal(
  options: SchedulerLifecycleOptions
): Promise<void> {
  const { scheduler, daemonMode } = options;

  await new Promise<void>((resolve) => {
    let cleaningUp = false;

    const onSignal = async () => {
      if (cleaningUp) {
        return;
      }
      cleaningUp = true;

      process.off('SIGINT', onSignal);
      process.off('SIGTERM', onSignal);

      try {
        await scheduler.shutdown(daemonMode);
      } finally {
        resolve();
      }
    };

    process.on('SIGINT', onSignal);
    process.on('SIGTERM', onSignal);
  });
}
