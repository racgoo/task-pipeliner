import { createCliExecutionOutputPort, createCliTaskRunOutputPort } from '@cli/core-adapters';
import { Executor } from '@core/execution/executor';
import type {
  ExecutionOutputPort,
  PromptOption,
  SchedulerOutputPort,
  TaskRunOutputPort,
} from '@core/execution/ports';
import { TaskRunner } from '@core/runtime/task-runner';
import { ScheduleManager } from '@core/scheduling/schedule-manager';
import { WorkflowScheduler } from '@core/scheduling/scheduler';
import { Workspace } from '@core/workflow/workspace';
import { ChoicePrompt, TextPrompt } from '../../cli/prompts/index';

export interface TestExecutorOptions {
  choose?: (message: string, options: PromptOption[]) => Promise<PromptOption>;
  text?: (message: string, defaultValue?: string) => Promise<string>;
  executionOutputPort?: ExecutionOutputPort;
  taskRunOutputPort?: TaskRunOutputPort;
  taskRunner?: TaskRunner;
  workspace?: Workspace;
}

export function createTestExecutor(options: TestExecutorOptions = {}): Executor {
  const choicePrompt = new ChoicePrompt();
  const textPrompt = new TextPrompt();
  const taskRunOutputPort = options.taskRunOutputPort ?? createCliTaskRunOutputPort();
  const taskRunner = options.taskRunner ?? new TaskRunner({ outputPort: taskRunOutputPort });
  const choose =
    options.choose ??
    (async (message: string, opts: PromptOption[]): Promise<PromptOption> =>
      choicePrompt.prompt(message, opts));
  const text =
    options.text ??
    (async (message: string, defaultValue?: string): Promise<string> =>
      textPrompt.prompt(message, defaultValue));

  return new Executor({
    promptPort: { choose, text },
    executionOutputPort: options.executionOutputPort ?? createCliExecutionOutputPort(),
    taskRunOutputPort,
    taskRunner,
    workspace: options.workspace,
  });
}

export interface TestSchedulerOptions {
  outputPort: SchedulerOutputPort;
  executor: { execute: Executor['execute'] };
  scheduleManager?: ScheduleManager;
}

export function createTestScheduler(options: TestSchedulerOptions): WorkflowScheduler {
  return new WorkflowScheduler({
    executorFactory: {
      createExecutor: () => options.executor,
    },
    schedulerOutputPort: options.outputPort,
    scheduleManager: options.scheduleManager,
  });
}
