import * as readline from 'readline';
import chalk from 'chalk';
import inquirer from 'inquirer';

const CHOICE_PAGE_SIZE = 15;
export class ChoicePrompt {
  private searchable: boolean;

  /**
   * Create a new ChoicePrompt instance
   *
   * @param searchable - If true, allows searching/filtering options by typing
   */
  constructor(searchable = false) {
    this.searchable = searchable;
  }

  /**
   * Show choice menu to user and return selected option
   *
   * @param message - Question to ask user
   * @param options - List of options (each has id and label)
   * @returns Selected option object
   */
  async prompt(
    message: string,
    options: Array<{ id: string; label: string }>
  ): Promise<{ id: string; label: string }> {
    if (this.searchable) {
      return this.promptWithSearch(message, options);
    }

    // Use inquirer to show interactive menu
    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: chalk.cyan(message),
        // Convert our options format to inquirer format
        choices: options.map((opt) => ({
          name: opt.label, // What user sees
          value: opt.id, // What we get back
        })),
        pageSize: CHOICE_PAGE_SIZE,
      },
    ]);

    // Find the full option object by id
    const selected = options.find((opt) => opt.id === choice);
    if (!selected) {
      throw new Error(`Invalid choice: ${choice}`);
    }
    return selected;
  }

  /**
   * Show searchable choice menu using raw terminal input
   * Navigate with arrow keys, type to filter in real-time
   * Uses alternate screen buffer to preserve terminal history
   */
  private async promptWithSearch(
    message: string,
    options: Array<{ id: string; label: string }>
  ): Promise<{ id: string; label: string }> {
    return new Promise((resolve) => {
      let searchTerm = '';
      let selectedIndex = 0;
      let filteredOptions = [...options];

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
      });

      // Enable raw mode to capture key presses
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
      }

      // Switch to alternate screen buffer (preserves terminal history)
      process.stdout.write('\x1B[?1049h');
      // Hide cursor
      process.stdout.write('\x1B[?25l');

      const render = () => {
        // Move cursor to top-left and clear screen
        process.stdout.write('\x1B[H\x1B[2J');

        // Show message
        console.log(chalk.cyan(`? ${message}`));

        // Show search input
        const searchDisplay = searchTerm
          ? chalk.gray(`  Filter: ${searchTerm}`) +
            chalk.gray(` (${filteredOptions.length}/${options.length})`)
          : chalk.gray('  Type to filter, ↑↓ to navigate, Enter to select');
        console.log(searchDisplay);
        console.log();

        // Calculate visible range (pagination)
        const maxVisible = CHOICE_PAGE_SIZE;
        let startIndex = 0;
        let endIndex = filteredOptions.length;

        if (filteredOptions.length > maxVisible) {
          // Center the selected item in the visible range
          const halfVisible = Math.floor(maxVisible / 2);
          startIndex = Math.max(0, selectedIndex - halfVisible);
          endIndex = Math.min(filteredOptions.length, startIndex + maxVisible);

          // Adjust if we're near the end
          if (endIndex === filteredOptions.length) {
            startIndex = Math.max(0, endIndex - maxVisible);
          }
        }

        // Show options
        if (filteredOptions.length === 0) {
          console.log(chalk.yellow('  No matches found'));
        } else {
          // Show "more items above" indicator
          if (startIndex > 0) {
            console.log(chalk.gray(`  ↑ ${startIndex} more above`));
          }

          for (let i = startIndex; i < endIndex; i++) {
            const opt = filteredOptions[i];
            if (i === selectedIndex) {
              console.log(chalk.cyan(`❯ ${opt.label}`));
            } else {
              console.log(chalk.white(`  ${opt.label}`));
            }
          }

          // Show "more items below" indicator
          if (endIndex < filteredOptions.length) {
            console.log(chalk.gray(`  ↓ ${filteredOptions.length - endIndex} more below`));
          }
        }
      };

      const updateFilter = () => {
        const term = searchTerm.toLowerCase();
        filteredOptions = term
          ? options.filter((opt) => opt.label.toLowerCase().includes(term))
          : [...options];

        // Reset selection if current selection is out of bounds
        if (selectedIndex >= filteredOptions.length) {
          selectedIndex = Math.max(0, filteredOptions.length - 1);
        }
      };

      const cleanup = () => {
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false);
        }
        rl.close();
        // Show cursor
        process.stdout.write('\x1B[?25h');
        // Return to normal screen buffer (restores terminal history)
        process.stdout.write('\x1B[?1049l');
      };

      // Initial render
      render();

      // Handle key presses
      process.stdin.on('data', (key: Buffer) => {
        const keyStr = key.toString();

        // Ctrl+C - exit
        if (keyStr === '\x03') {
          cleanup();
          process.exit(0);
        }

        // Enter - select
        if (keyStr === '\r' || keyStr === '\n') {
          if (filteredOptions.length > 0) {
            cleanup();
            resolve(filteredOptions[selectedIndex]);
          }
          return;
        }

        // Escape - clear filter or exit
        if (keyStr === '\x1B' && key.length === 1) {
          if (searchTerm) {
            searchTerm = '';
            updateFilter();
            render();
          }
          return;
        }

        // Arrow up
        if (keyStr === '\x1B[A') {
          if (filteredOptions.length > 0) {
            selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : filteredOptions.length - 1;
            render();
          }
          return;
        }

        // Arrow down
        if (keyStr === '\x1B[B') {
          if (filteredOptions.length > 0) {
            selectedIndex = selectedIndex < filteredOptions.length - 1 ? selectedIndex + 1 : 0;
            render();
          }
          return;
        }

        // Backspace - remove last character from search
        if (keyStr === '\x7F' || keyStr === '\b') {
          if (searchTerm.length > 0) {
            searchTerm = searchTerm.slice(0, -1);
            updateFilter();
            render();
          }
          return;
        }

        // Printable characters - add to search
        if (keyStr.length === 1 && keyStr >= ' ' && keyStr <= '~') {
          searchTerm += keyStr;
          updateFilter();
          render();
        }
      });
    });
  }
}

/**
 * Text Prompt
 *
 * Asks user to type text input.
 * User can type anything and press Enter.
 *
 * Example:
 *   Enter version number: 1.0.0
 */
export class TextPrompt {
  /**
   * Ask user for text input
   *
   * @param message - Question to ask user
   * @param defaultValue - Optional default value (shown in brackets)
   * @returns User's input text
   */
  async prompt(message: string, defaultValue?: string): Promise<string> {
    // Use inquirer to show text input field
    const { value } = await inquirer.prompt([
      {
        type: 'input',
        name: 'value',
        message: chalk.cyan(message),
        default: defaultValue, // Shown as [defaultValue] if provided
      },
    ]);

    return value;
  }
}
