import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Workflow } from '@tp-types/workflow';
import { Executor } from '../executor';

// Mock ChoicePrompt
const mockPrompt = vi.fn();
vi.mock('../../cli/prompts/index', () => {
  return {
    ChoicePrompt: vi.fn().mockImplementation(() => {
      return {
        prompt: mockPrompt,
      };
    }),
    TextPrompt: vi.fn().mockImplementation(() => {
      return {
        prompt: vi.fn(),
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

describe('Executor - Choice Condition', () => {
  let executor: Executor;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new Executor();
  });

  it('should execute step after choice is made', async () => {
    const workflow: Workflow = {
      steps: [
        {
          choose: {
            message: 'Deploy to which environment?',
            options: [
              { id: 'staging', label: 'Staging' },
              { id: 'prod', label: 'Production' },
            ],
            as: 'env',
          },
        },
        {
          when: {
            var: {
              env: 'staging',
            },
          },
          run: 'echo "Deploying to staging..."',
        },
        {
          when: {
            var: {
              env: 'prod',
            },
          },
          run: 'echo "Deploying to production..."',
        },
      ],
    };

    // Mock staging selection
    mockPrompt.mockResolvedValueOnce({ id: 'staging', label: 'Staging' });

    await executor.execute(workflow);

    // Check workspace state
    const workspace = (executor as any).workspace;
    expect(workspace.hasChoice('staging')).toBe(true);
    expect(workspace.getVariable('env')).toBe('staging');

    // staging step should execute after staging is selected
    const calls = mockRun.mock.calls.map((call) => call[0]);
    expect(calls).toContain('echo "Deploying to staging..."');
    expect(calls).not.toContain('echo "Deploying to production..."');

    // Check call count
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('should skip step when choice condition is not met', async () => {
    const workflow: Workflow = {
      steps: [
        {
          choose: {
            message: 'Deploy to which environment?',
            options: [
              { id: 'staging', label: 'Staging' },
              { id: 'prod', label: 'Production' },
            ],
            as: 'env',
          },
        },
        {
          when: {
            var: {
              env: 'staging',
            },
          },
          run: 'echo "Deploying to staging..."',
        },
        {
          when: {
            var: {
              env: 'prod',
            },
          },
          run: 'echo "Deploying to production..."',
        },
      ],
    };

    // Mock prod selection
    mockPrompt.mockResolvedValueOnce({ id: 'prod', label: 'Production' });

    await executor.execute(workflow);

    // prod step should execute after prod is selected
    const calls = mockRun.mock.calls.map((call) => call[0]);
    expect(calls).toContain('echo "Deploying to production..."');
    expect(calls).not.toContain('echo "Deploying to staging..."');
  });

  it('should handle multiple choices', async () => {
    const workflow: Workflow = {
      steps: [
        {
          choose: {
            message: 'First choice?',
            options: [{ id: 'option1', label: 'Option 1' }],
            as: 'first',
          },
        },
        {
          when: {
            var: {
              first: 'option1',
            },
          },
          choose: {
            message: 'Second choice?',
            options: [{ id: 'option2', label: 'Option 2' }],
            as: 'second',
          },
        },
        {
          when: {
            all: [
              {
                var: {
                  first: 'option1',
                },
              },
              {
                var: {
                  second: 'option2',
                },
              },
            ],
          },
          run: 'echo "Both choices made"',
        },
      ],
    };

    mockPrompt
      .mockResolvedValueOnce({ id: 'option1', label: 'Option 1' })
      .mockResolvedValueOnce({ id: 'option2', label: 'Option 2' });

    await executor.execute(workflow);

    // step should execute after both choices are set
    const calls = mockRun.mock.calls.map((call) => call[0]);
    expect(calls).toContain('echo "Both choices made"');
  });
});
