import { getDaemonStatus } from '@core/daemon-manager';
import { ScheduleManager } from '@core/schedule-manager';
import { uiBox as boxen, uiText as chalk } from '@ui/primitives';
import { formatScheduleCard } from '../card-format';

/**
 * List all schedules (rich table-style UI)
 */
export async function listSchedules(): Promise<void> {
  const manager = new ScheduleManager();
  const schedules = await manager.loadSchedules();

  if (schedules.length === 0) {
    const emptyMsg = [
      chalk.gray('No schedules registered.'),
      '',
      chalk.dim('  tp schedule add <schedule.yaml>   add from a schedule file'),
    ].join('\n');
    console.log(
      `\n${boxen(emptyMsg, {
        borderStyle: 'round',
        padding: { top: 1, bottom: 1, left: 2, right: 2 },
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        borderColor: 'gray',
      })}\n`
    );
    return;
  }

  const daemonStatus = await getDaemonStatus();
  const daemonBadge = daemonStatus.running ? chalk.green('● running') : chalk.gray('○ stopped');
  const enabledCount = schedules.filter((s) => s.enabled).length;
  const title = chalk.bold('📅 Workflow Schedules');
  console.log(title);
  console.log(
    [
      chalk.gray('  Daemon: '),
      daemonBadge,
      chalk.gray(`  ·  Schedules: ${enabledCount}/${schedules.length} enabled`),
    ].join('')
  );

  for (const s of schedules) {
    console.log(formatScheduleCard(s, { daemonRunning: daemonStatus.running }));
  }

  console.log(
    chalk.dim(
      '  Tip: tp schedule start — run scheduler daemon; tp schedule status — view live status'
    )
  );
}
