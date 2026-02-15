import type { Record as WorkflowRecord, Step } from '@tp-types/workflow';
import { uiTone } from '@ui/primitives';

export function getStepType(step: Step): string {
  if ('run' in step) return 'Run';
  if ('choose' in step) return 'Choose';
  if ('prompt' in step) return 'Prompt';
  if ('parallel' in step) return 'Parallel';
  if ('fail' in step) return 'Fail';
  return 'Unknown';
}

/**
 * Step description with resolved values (command after substitution, choice/prompt result)
 */
export function getStepDescription(record: WorkflowRecord): string {
  const step = record.step;
  const lines: string[] = [];

  if ('run' in step) {
    const resolved = record.resolvedCommand;
    const displayCmd = resolved ?? step.run;
    lines.push(`Command: ${uiTone.warning(displayCmd)}`);
    if (resolved && resolved !== step.run) {
      lines.push(`${uiTone.muted('Template:')} ${uiTone.muted(step.run)}`);
    }
  } else if ('choose' in step) {
    lines.push(`Message: ${uiTone.warning(step.choose.message)}`);
    if (record.choiceValue !== undefined) {
      const label =
        step.choose.options.find((o) => o.id === record.choiceValue)?.label ?? record.choiceValue;
      lines.push(
        `${uiTone.muted('Selected:')} ${uiTone.accent(record.choiceValue)}${label !== record.choiceValue ? ` (${label})` : ''}`
      );
    }
  } else if ('prompt' in step) {
    lines.push(
      `Message: ${uiTone.warning(step.prompt.message)} | Variable: ${uiTone.accent(step.prompt.as)}`
    );
    if (record.promptValue !== undefined) {
      lines.push(`${uiTone.muted('Entered:')} ${uiTone.accent(String(record.promptValue))}`);
    }
  } else if ('parallel' in step) {
    lines.push(`Parallel execution with ${step.parallel.length} branches`);
  } else if ('fail' in step) {
    lines.push(`Error: ${uiTone.error(step.fail.message)}`);
  } else {
    lines.push('Unknown step type');
  }

  return lines.join('\n');
}

export function isTaskRunResult(
  output: unknown
): output is { success: boolean; stdout: string[]; stderr: string[] } {
  return (
    typeof output === 'object' &&
    output !== null &&
    'success' in output &&
    'stdout' in output &&
    'stderr' in output
  );
}

export function displayTaskOutput(output: {
  success: boolean;
  stdout: string[];
  stderr: string[];
}): void {
  if (output.stdout.length > 0) {
    const stdoutContent = output.stdout.map((line) => uiTone.muted(`  ${line}`)).join('\n');
    console.log(uiTone.success('  Output:'));
    console.log(stdoutContent);
  }
  if (output.stderr.length > 0) {
    const stderrContent = output.stderr.map((line) => uiTone.muted(`  ${line}`)).join('\n');
    console.log(uiTone.error('  Errors:'));
    console.log(stderrContent);
  }
}
