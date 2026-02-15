import { basename, dirname, isAbsolute, resolve } from 'path';
import type { Schedule } from '@tp-types/schedule';
import type { ScheduleDefinition } from '@tp-types/schedule-file';
import { uiText as chalk } from '@ui/primitives';
import { getCronDescription } from '../card-format';

/**
 * Resolve workflow path relative to schedule file or baseDir
 */
export function resolveWorkflowPath(
  scheduleFilePath: string,
  scheduleDef: ScheduleDefinition
): string {
  const workflow = scheduleDef.workflow;

  if (isAbsolute(workflow)) {
    return workflow;
  }

  const baseDir = scheduleDef.baseDir ? resolve(scheduleDef.baseDir) : dirname(scheduleFilePath);
  return resolve(baseDir, workflow);
}

/**
 * Build rich label for schedule (alias · filename · cron · human description · status)
 * @param statusStyle - 'plain' = ✓/✗ (remove list), 'color' = colored "Enabled"/"Disabled" (toggle list)
 */
export function scheduleChoiceLabel(s: Schedule, statusStyle: 'plain' | 'color' = 'plain'): string {
  const alias = s.name ?? '(no alias)';
  const filename = basename(s.workflowPath);
  const human = getCronDescription(s.cron) ?? s.cron;
  const status =
    statusStyle === 'color'
      ? s.enabled
        ? chalk.green('Enabled')
        : chalk.dim('Disabled')
      : s.enabled
        ? '✓'
        : '✗';
  return `${alias} · ${filename} · ${s.cron} · ${human} · ${status}`;
}
