import { uiTone } from '@ui/primitives';
import inquirer from 'inquirer';
import { promptSearchableChoice, type ChoiceOption } from './searchable-choice';
export { TextPrompt } from './text-prompt';

/** Number of choices to show at once (pagination). */
const CHOICE_PAGE_SIZE = 15;

/**
 * Choice prompt (pick one from a list).
 * - searchable: false → uses inquirer list
 * - searchable: true → raw terminal input + search/filter (no alternate screen, in-place redraw)
 */
export class ChoicePrompt {
  private searchable: boolean;

  /**
   * @param searchable - If true, menu supports typing to search/filter
   */
  constructor(searchable = false) {
    this.searchable = searchable;
  }

  /**
   * Show choice menu and return the selected option.
   */
  async prompt(message: string, options: ChoiceOption[]): Promise<ChoiceOption> {
    if (this.searchable) {
      return promptSearchableChoice(message, options, CHOICE_PAGE_SIZE);
    }

    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: uiTone.accent(message),
        choices: options.map((opt) => ({
          name: opt.label,
          value: opt.id,
        })),
        pageSize: CHOICE_PAGE_SIZE,
      },
    ]);

    const selected = options.find((opt) => opt.id === choice);
    if (!selected) {
      throw new Error(`Invalid choice: ${choice}`);
    }
    return selected;
  }
}
