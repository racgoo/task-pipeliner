import { uiTone } from '@ui/primitives';
import inquirer from 'inquirer';

/**
 * Text input prompt (single line).
 * Uses inquirer input. Example: "Enter version number: 1.0.0"
 */
export class TextPrompt {
  /**
   * @param message - Prompt text
   * @param defaultValue - Optional default (shown as [defaultValue] if provided)
   */
  async prompt(message: string, defaultValue?: string): Promise<string> {
    const { value } = await inquirer.prompt([
      {
        type: 'input',
        name: 'value',
        message: uiTone.accent(message),
        default: defaultValue,
      },
    ]);

    return value;
  }
}
