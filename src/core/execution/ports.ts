import type { History, Workflow } from '@tp-types/workflow';

export interface PromptOption {
  id: string;
  label: string;
}

export interface PromptPort {
  choose(message: string, options: PromptOption[]): Promise<PromptOption>;
  text(message: string, defaultValue?: string): Promise<string>;
}

export interface ExecutionOutputPort {
  showStepFooter(success: boolean, durationMs: number): void;
  showTotalExecutionTime(durationMs: number): void;
  showTimeline(history: History): void;
}

export interface TaskRunHeaderOptions {
  title?: string;
  borderColor?: 'cyan' | 'green' | 'yellow' | 'red' | 'blue';
  isNested?: boolean;
}

export interface TaskRunOutputPort {
  createStepHeaderBox(
    content: string,
    lineNumber?: number,
    fileName?: string,
    options?: TaskRunHeaderOptions
  ): string;
  createStepFooterMessage(success: boolean, isNested?: boolean, durationMs?: number): string;
  createErrorBox(error: string): string;
  formatNestedLine(line: string, isNested?: boolean): string;
  createParallelHeaderBox(branchCount: number): string;
  createParallelFooterMessage(allSucceeded: boolean): string;
}

export interface ExecutorRunOptions {
  executionVars?: Record<string, string>;
}

export interface ExecutorRunner {
  execute(workflow: Workflow, options?: ExecutorRunOptions): Promise<void>;
}

export interface ExecutorFactoryPort {
  createExecutor(): ExecutorRunner;
}

export interface SchedulerOutputPort {
  showSchedulerStart(daemonMode: boolean): void;
  showSchedulerStarted(daemonMode: boolean, pid: number, daemonChild: boolean): void;
  showSchedulerStopping(daemonMode: boolean): void;
  showNoEnabledSchedules(): void;
  showScheduleStartFailed(scheduleId: string, error: unknown): void;
  showInvalidCronExpression(scheduleId: string, cronExpression: string): void;
  showCronScheduleFailed(scheduleId: string, timezone: string | undefined, error: unknown): void;
  showScheduledWorkflowStart(name: string, profile?: string): void;
  showScheduledWorkflowCompleted(name: string): void;
  showScheduledWorkflowFailed(name: string, error: unknown): void;
}
