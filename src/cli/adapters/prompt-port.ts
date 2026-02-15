import type { PromptOption, PromptPort } from '@core/execution/ports';
import { ChoicePrompt, TextPrompt } from '../prompts';

class CliPromptPort implements PromptPort {
  private choicePrompt = new ChoicePrompt();
  private textPrompt = new TextPrompt();

  async choose(message: string, options: PromptOption[]): Promise<PromptOption> {
    return this.choicePrompt.prompt(message, options);
  }

  async text(message: string, defaultValue?: string): Promise<string> {
    return this.textPrompt.prompt(message, defaultValue);
  }
}

export function createCliPromptPort(): PromptPort {
  return new CliPromptPort();
}
