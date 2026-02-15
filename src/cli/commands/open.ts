import { exec } from 'child_process';
import { promisify } from 'util';
import { uiMessage, uiTone } from '@ui/primitives';
import type { Command } from 'commander';
import { runCommandAction, throwHandledCliError } from '../shared/command-runtime';

const execAsync = promisify(exec);

export function registerOpenCommand(program: Command): void {
  program
    .command('open')
    .description('Open generator or docs website in browser')
    .argument('<target>', 'Target to open: "generator" or "docs"')
    .addHelpText(
      'after',
      '\nExamples:\n  $ tp open generator\n  $ tp open docs\n\nTargets:\n  generator  Open the visual workflow generator (https://task-pipeliner-generator.racgoo.com/)\n  docs       Open the documentation site (https://task-pipeliner.racgoo.com/)'
    )
    .action((target: string) =>
      runCommandAction(async () => {
        const urls: Record<string, string> = {
          generator: 'https://task-pipeliner-generator.racgoo.com/',
          docs: 'https://task-pipeliner.racgoo.com/',
        };

        const url = urls[target.toLowerCase()];
        if (!url) {
          console.error(uiMessage.errorLine(`Invalid target: ${target}`));
          console.log(uiTone.warning('\nValid targets:'));
          console.log(uiTone.warning('  • generator - Open the visual workflow generator'));
          console.log(uiTone.warning('  • docs      - Open the documentation site'));
          throwHandledCliError(1);
        }

        try {
          const platform = process.platform;
          let command: string;

          if (platform === 'darwin') {
            command = `open "${url}"`;
          } else if (platform === 'win32') {
            command = `start "${url}"`;
          } else {
            command = `xdg-open "${url}"`;
          }

          await execAsync(command);
          console.log(
            uiMessage.successLine(
              `Opening ${target === 'generator' ? 'generator' : 'documentation'} in browser...`
            )
          );
          console.log(uiTone.info(`   ${url}`));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(uiMessage.errorLine(`Failed to open browser: ${errorMessage}`));
          console.log(uiTone.warning(`\nPlease visit manually: ${url}`));
          throwHandledCliError(1);
        }
      })
    );
}
