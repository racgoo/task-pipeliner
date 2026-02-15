import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import { getDaemonStatus, isDaemonRunning } from '@core/scheduling/daemon-manager';
import { uiMessage, uiTone } from '@ui/primitives';
import type { Command } from 'commander';
import { createCliScheduler } from '../core-adapters';
import { ChoicePrompt } from '../prompts/index';

const PIPELINER_ROOT = join(homedir(), '.pipeliner');

export function registerCleanCommand(program: Command): void {
  /**
   * Clean command - Remove ~/.pipeliner data (schedules, daemon state, workflow history)
   * Useful after upgrades when data may be incompatible.
   */
  program
    .command('clean')
    .description(
      'Remove all data in ~/.pipeliner (schedules, daemon state, workflow history). Use after upgrades if data is incompatible.'
    )
    .action(async () => {
      const choicePrompt = new ChoicePrompt();
      const confirmChoice = await choicePrompt.prompt(
        `This will remove all data in ${uiTone.warning(PIPELINER_ROOT)} (schedules, daemon PID, workflow history). Continue?`,
        [
          { id: 'yes', label: 'Yes, remove all' },
          { id: 'no', label: 'No, cancel' },
        ]
      );

      if (confirmChoice?.id !== 'yes') {
        console.log(uiMessage.cancelledLine());
        return;
      }

      try {
        if (await isDaemonRunning()) {
          const status = await getDaemonStatus();
          console.log(uiTone.muted(`Stopping scheduler daemon (PID: ${status.pid})...`));
          const scheduler = createCliScheduler();
          await scheduler.stopDaemon();
          console.log(uiTone.muted('  Daemon stopped'));
        }

        if (existsSync(PIPELINER_ROOT)) {
          await rm(PIPELINER_ROOT, { recursive: true });
          console.log(uiMessage.successLine(`Removed ${PIPELINER_ROOT}`));
        } else {
          console.log(uiTone.muted(`\n  ${PIPELINER_ROOT} does not exist (already clean)`));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(uiMessage.errorLine(`Clean failed: ${errorMessage}`));
        process.exit(1);
      }
    });
}
