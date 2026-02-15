import { WorkflowHistoryManager } from '@core/history/manager';
import { uiMessage } from '@ui/primitives';
import type { Command } from 'commander';
import { displayHistory } from '../history/display';
import { ChoicePrompt } from '../prompts/index';
import { runCommandAction, throwHandledCliError } from '../shared/command-runtime';

export function registerHistoryCommand(program: Command): void {
  /**
   * History command group
   * Manages workflow execution history with subcommands or interactive selection
   */
  const historyCommand = program
    .command('history')
    .description('Manage workflow execution history');

  /**
   * Main history command action
   * When no subcommand is provided, shows interactive menu to select action
   */
  historyCommand.action(() =>
    runCommandAction(async () => {
      const choicePrompt = new ChoicePrompt();
      const searchableChoicePrompt = new ChoicePrompt(true);
      const choice = await choicePrompt.prompt('Select an action', [
        { id: 'show', label: 'Show - View and select a history to view' },
        { id: 'remove', label: 'Remove - Delete a specific history file' },
        { id: 'remove-all', label: 'Remove All - Delete all history files' },
      ]);

      if (!choice?.id) {
        console.error(uiMessage.errorLine('Invalid choice'));
        throwHandledCliError(1);
      }

      // Execute the selected action
      const historyManager = new WorkflowHistoryManager();

      switch (choice.id) {
        case 'show': {
          const historyNames = await historyManager.getHistoryNames();

          if (historyNames.length === 0) {
            console.log(uiMessage.warningLine('No history found'));
            return;
          }

          const selectedChoice = await searchableChoicePrompt.prompt(
            'Select a history to view',
            historyNames.map((name) => ({
              id: name,
              label: name,
            }))
          );

          if (!selectedChoice?.id) {
            console.error(uiMessage.errorLine('Invalid choice'));
            throwHandledCliError(1);
          }

          try {
            const history = await historyManager.getHistory(selectedChoice.id);
            displayHistory(history, selectedChoice.id);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(uiMessage.errorLine(`Failed to load history: ${errorMessage}`));
            throwHandledCliError(1);
          }
          break;
        }
        case 'remove': {
          const historyNames = await historyManager.getHistoryNames();

          if (historyNames.length === 0) {
            console.log(uiMessage.warningLine('No history found'));
            return;
          }

          const selectedChoice = await searchableChoicePrompt.prompt(
            'Select a history to remove',
            historyNames.map((name) => ({
              id: name,
              label: name,
            }))
          );

          if (!selectedChoice?.id) {
            console.error(uiMessage.errorLine('Invalid choice'));
            throwHandledCliError(1);
          }

          try {
            await historyManager.removeHistory(selectedChoice.id);
            console.log(uiMessage.successLine(`Removed history: ${selectedChoice.id}`));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(uiMessage.errorLine(`Failed to remove history: ${errorMessage}`));
            throwHandledCliError(1);
          }
          break;
        }
        case 'remove-all': {
          const confirmChoice = await choicePrompt.prompt(
            'Are you sure you want to remove all histories?',
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
            await historyManager.clearAllHistories();
            console.log(uiMessage.successLine('All histories removed'));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(uiMessage.errorLine(`Failed to remove histories: ${errorMessage}`));
            throwHandledCliError(1);
          }
          break;
        }
        default:
          console.error(uiMessage.errorLine(`Unknown action: ${choice.id}`));
          throwHandledCliError(1);
      }
    })
  );
}
