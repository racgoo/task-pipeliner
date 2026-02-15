import { Executor } from '@core/execution/executor';
import type { ExecutorFactoryPort } from '@core/execution/ports';
import { WorkflowScheduler } from '@core/scheduling/scheduler';
import { createCliExecutionOutputPort } from './execution-output-port';
import { createCliPromptPort } from './prompt-port';
import { createCliSchedulerOutputPort } from './scheduler-output-port';
import { createCliTaskRunOutputPort } from './task-run-output-port';

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
