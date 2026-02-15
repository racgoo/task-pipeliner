import type { ExecutionOutputPort } from '@core/execution/ports';
import type { History } from '@tp-types/workflow';
import { formatDuration } from '@ui/index';
import { uiText as chalk } from '@ui/primitives';
import { createStepFooterMessage } from '@ui/text';
import { generateTimeline } from '../timeline/index';

class CliExecutionOutputPort implements ExecutionOutputPort {
  showStepFooter(success: boolean, durationMs: number): void {
    const footerMessage = createStepFooterMessage(success, false, durationMs);
    console.log(footerMessage);
  }

  showTotalExecutionTime(durationMs: number): void {
    const totalDuration = formatDuration(durationMs);
    console.log(chalk.cyan(`\nTotal execution time: ${totalDuration}`));
  }

  showTimeline(history: History): void {
    const timeline = generateTimeline(history);
    if (timeline) {
      console.log(timeline);
    }
  }
}

export function createCliExecutionOutputPort(): ExecutionOutputPort {
  return new CliExecutionOutputPort();
}
