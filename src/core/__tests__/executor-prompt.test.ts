import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Workflow } from '../../types/workflow.js';
import { Executor } from '../executor.js';

// Mock TextPrompt
const mockTextPrompt = vi.fn();
vi.mock('../../cli/prompts.js', () => {
  return {
    ChoicePrompt: vi.fn().mockImplementation(() => {
      return {
        prompt: vi.fn(),
      };
    }),
    TextPrompt: vi.fn().mockImplementation(() => {
      return {
        prompt: mockTextPrompt,
      };
    }),
  };
});

// Mock TaskRunner
const mockRun = vi.fn().mockResolvedValue(true);
vi.mock('../task-runner.js', () => {
  return {
    TaskRunner: vi.fn().mockImplementation(() => {
      return {
        run: mockRun,
      };
    }),
  };
});

describe('Executor - Prompt Step', () => {
  let executor: Executor;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new Executor();
  });

  it('should execute prompt step and save as fact', async () => {
    const workflow: Workflow = {
      steps: [
        {
          prompt: {
            message: 'What is your name?',
            as: 'user_name',
          },
        },
        {
          when: { file: 'package.json' },
          run: 'echo "Hello"',
        },
      ],
    };

    mockTextPrompt.mockResolvedValueOnce('John');

    await executor.execute(workflow);

    // Prompt should be called
    expect(mockTextPrompt).toHaveBeenCalledWith('What is your name?', undefined);
    
    // step should execute after fact is set
    const calls = mockRun.mock.calls.map(call => call[0]);
    expect(calls).toContain('echo "Hello"');
  });

  it('should use default value in prompt', async () => {
    const workflow: Workflow = {
      steps: [
        {
          prompt: {
            message: 'Enter version:',
            as: 'version',
            default: '1.0.0',
          },
        },
      ],
    };

    mockTextPrompt.mockResolvedValueOnce('1.0.0');

    await executor.execute(workflow);

    // Prompt should be called with default value
    expect(mockTextPrompt).toHaveBeenCalledWith('Enter version:', '1.0.0');
  });

  it('should save prompt value as fact and use in condition', async () => {
    const workflow: Workflow = {
      steps: [
        {
          prompt: {
            message: 'Enter environment:',
            as: 'env',
          },
        },
        {
          when: { file: 'package.json' },
          run: 'echo "Deploying to {{env}}"',
        },
      ],
    };

    mockTextPrompt.mockResolvedValueOnce('production');

    await executor.execute(workflow);

    // step should execute when condition is satisfied after prompt
    expect(mockRun.mock.calls.length).toBeGreaterThan(0);
  });

  it('should combine prompt and choose', async () => {
    const workflow: Workflow = {
      steps: [
        {
          prompt: {
            message: 'Enter project name:',
            as: 'project_name',
          },
        },
        {
          choose: {
            message: 'Select environment:',
            options: [
              { id: 'staging', label: 'Staging' },
              { id: 'prod', label: 'Production' },
            ],
          },
        },
        {
          choose: {
            message: 'Select environment:',
            options: [
              { id: 'prod', label: 'Production' },
            ],
            as: 'env',
          },
        },
        {
          when: {
            all: [
              { file: 'package.json' },
              {
                var: {
                  env: 'prod'
                }
              },
            ],
          },
          run: 'echo "Deploying {{project_name}} to production"',
        },
      ],
    };

    mockTextPrompt.mockResolvedValueOnce('my-app');
    const mockChoicePrompt = (executor as any).choicePrompt;
    // Mock both choose steps
    mockChoicePrompt.prompt
      .mockResolvedValueOnce({ id: 'prod', label: 'Production' })
      .mockResolvedValueOnce({ id: 'prod', label: 'Production' });

    await executor.execute(workflow);

    // Both prompt and choose should execute, and step should execute when condition is satisfied
    expect(mockRun.mock.calls.length).toBeGreaterThan(0);
  });
});

