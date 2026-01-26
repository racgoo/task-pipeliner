import chalk from 'chalk';
import inquirer from 'inquirer';

/**
 * Choice Prompt
 *
 * Shows user a selection menu with multiple options.
 * User can select one option using arrow keys and Enter.
 *
 * Example:
 *   Choose environment:
 *   > Development
 *     Staging
 *     Production
 */
export class ChoicePrompt {
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
      },
    ]);

    // Find the full option object by id
    const selected = options.find((opt) => opt.id === choice);
    if (!selected) {
      throw new Error(`Invalid choice: ${choice}`);
    }
    return selected;
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
