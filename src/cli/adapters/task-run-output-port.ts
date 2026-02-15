import type { TaskRunHeaderOptions, TaskRunOutputPort } from '@core/execution/ports';
import {
  createErrorBox,
  createParallelFooterMessage,
  createParallelHeaderBox,
  createStepFooterMessage,
  createStepHeaderBox,
  formatNestedLine,
} from '@ui/index';

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

export function createCliTaskRunOutputPort(): TaskRunOutputPort {
  return new CliTaskRunOutputPort();
}
