import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { extname, join, resolve } from 'path';
import { getDaemonStatus } from '@core/scheduling/daemon-manager';
import { parseScheduleFile } from '@core/scheduling/schedule-file-parser';
import { ScheduleManager } from '@core/scheduling/schedule-manager';
import { uiText as chalk } from '@ui/primitives';
import inquirer from 'inquirer';
import cron from 'node-cron';
import { ChoicePrompt } from '../../prompts';
import { findNearestTpDirectory } from '../../shared/utils';
import { formatScheduleCard } from '../card-format';
import { resolveWorkflowPath } from './shared';

/**
 * Add schedules from a schedule file
 */
export async function addSchedules(scheduleFilePath?: string): Promise<void> {
  const manager = new ScheduleManager();

  if (!scheduleFilePath) {
    const tpDir = findNearestTpDirectory();
    if (!tpDir) {
      console.error(chalk.red('\n✗ No tp directory found'));
      process.exit(1);
    }
    const schedulesDir = join(tpDir, 'schedules');
    if (!existsSync(schedulesDir)) {
      console.error(chalk.red(`\n✗ No schedules directory found at ${schedulesDir}`));
      process.exit(1);
    }
    const files = await readdir(schedulesDir);
    const scheduleFiles = files.filter((file) => {
      const ext = extname(file).toLowerCase();
      return ['.yaml', '.yml', '.json'].includes(ext);
    });
    if (scheduleFiles.length === 0) {
      console.error(chalk.red(`\n✗ No schedule files found in ${schedulesDir}`));
      process.exit(1);
    }
    const choices = scheduleFiles.map((file) => ({
      id: join(schedulesDir, file),
      label: file,
    }));
    const choicePrompt = new ChoicePrompt(true);
    const selected = await choicePrompt.prompt('Select a schedule file to add', choices);
    scheduleFilePath = selected.id;
  }

  const resolvedPath = resolve(scheduleFilePath);

  if (!existsSync(resolvedPath)) {
    console.error(`✗ File not found: ${resolvedPath}`);
    process.exit(1);
  }

  let scheduleFile;
  try {
    scheduleFile = await parseScheduleFile(resolvedPath);
  } catch (error) {
    console.error(
      `✗ Failed to parse schedule file: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }

  const invalidCrons = scheduleFile.schedules.filter((s) => !cron.validate(s.cron));
  if (invalidCrons.length > 0) {
    console.error('✗ Invalid cron expression(s):');
    for (const s of invalidCrons) {
      console.error(`  - ${s.name}: "${s.cron}"`);
    }
    process.exit(1);
  }

  const missingWorkflows = scheduleFile.schedules.filter((s) => {
    const workflowPath = resolveWorkflowPath(resolvedPath, s);
    return !existsSync(workflowPath);
  });
  if (missingWorkflows.length > 0) {
    console.error('✗ Workflow file(s) not found:');
    for (const s of missingWorkflows) {
      const resolvedWorkflowPath = resolveWorkflowPath(resolvedPath, s);
      console.error(`  - ${s.name}: ${s.workflow} (resolved: ${resolvedWorkflowPath})`);
    }
    process.exit(1);
  }

  console.log(`\nFound ${scheduleFile.schedules.length} schedule(s) in file.\n`);

  const addedSchedules = [];
  for (const scheduleDef of scheduleFile.schedules) {
    const { alias } = await inquirer.prompt<{ alias: string }>([
      {
        type: 'input',
        name: 'alias',
        message: `Alias for "${scheduleDef.name}" (press Enter to use as-is):`,
        default: scheduleDef.name,
      },
    ]);

    const schedule = await manager.addSchedule({
      name: alias,
      workflowPath: resolveWorkflowPath(resolvedPath, scheduleDef),
      cron: scheduleDef.cron,
      enabled: true,
      timezone: scheduleDef.timezone,
      silent: scheduleDef.silent,
      profile: scheduleDef.profile,
    });

    addedSchedules.push(schedule);
  }

  const daemonStatus = await getDaemonStatus();
  console.log(`\n✓ Added ${addedSchedules.length} schedule(s) successfully\n`);
  for (const s of addedSchedules) {
    console.log(formatScheduleCard(s, { daemonRunning: daemonStatus.running }));
  }
  console.log(chalk.dim('  Tip: Run "tp schedule start" to start the scheduler daemon'));
}
