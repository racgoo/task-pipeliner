import inquirer from 'inquirer';
import { describe, expect, it, vi } from 'vitest';
import { ChoicePrompt } from '@cli/prompts/index';

// Test using actual inquirer
describe('Real Inquirer Test', () => {
  it('should return correct format from inquirer', async () => {
    const choicePrompt = new ChoicePrompt();

    // Mock inquirer directly
    const mockInquirer = vi.spyOn(inquirer, 'prompt');
    mockInquirer.mockResolvedValueOnce({ choice: 'staging' });

    const result = await choicePrompt.prompt('Test message', [
      { id: 'staging', label: 'Staging' },
      { id: 'prod', label: 'Production' },
    ]);

    expect(result).toEqual({ id: 'staging', label: 'Staging' });
    expect(result.id).toBe('staging');

    mockInquirer.mockRestore();
  });
});
