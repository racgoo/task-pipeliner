import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Workflow } from '../../types/workflow';
import { Executor } from '../executor';

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

// Mock ChoicePrompt, TextPrompt
const mockChoicePrompt = vi.fn();
vi.mock('../../cli/prompts.js', () => {
  return {
    ChoicePrompt: vi.fn().mockImplementation(() => {
      return {
        prompt: mockChoicePrompt,
      };
    }),
    TextPrompt: vi.fn().mockImplementation(() => {
      return {
        prompt: vi.fn(),
      };
    }),
  };
});

describe('Executor - Real Scenario Tests', () => {
  let executor: Executor;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new Executor();
  });

  it('should execute basic.yaml EXACT scenario - staging choice', async () => {
    // Exactly the same structure as basic.yaml
    const workflow: Workflow = {
      name: 'Basic Workflow Example',
      steps: [
        {
          run: 'echo "Building..."',
        },
        {
          run: 'echo "Build started, continuing..."',
        },
        {
          choose: {
            message: 'Deploy to which environment?',
            options: [
              { id: 'staging', label: 'Staging' },
              { id: 'prod', label: 'Production' },
            ],
          },
        },
        {
          when: {
            choice: 'staging',
          },
          run: 'echo "Deploying to staging..."',
        },
        {
          when: {
            choice: 'prod',
          },
          run: 'echo "Deploying to production..."',
        },
      ],
    };

    // Select staging
    mockChoicePrompt.mockResolvedValueOnce({ id: 'staging', label: 'Staging' });

    await executor.execute(workflow);

    // Check execution order
    const calls = mockRun.mock.calls.map((call) => call[0]);

    // Required execution check
    expect(calls).toContain('echo "Building..."');
    expect(calls).toContain('echo "Build started, continuing..."');
    expect(calls).toContain('echo "Deploying to staging..."');

    // Should not be executed
    expect(calls).not.toContain('echo "Deploying to production..."');

    // Check workspace state
    const workspace = (executor as any).workspace;
    expect(workspace.hasChoice('staging')).toBe(true);
    expect(workspace.hasChoice('prod')).toBe(false);

    // Check execution count (3 steps executed)
    expect(mockRun).toHaveBeenCalledTimes(3);
  });

  it('should execute basic.yaml EXACT scenario - prod choice', async () => {
    const workflow: Workflow = {
      name: 'Basic Workflow Example',
      steps: [
        {
          run: 'echo "Building..."',
        },
        {
          run: 'echo "Build started, continuing..."',
        },
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

    // Select prod
    mockChoicePrompt.mockResolvedValueOnce({ id: 'prod', label: 'Production' });

    await executor.execute(workflow);

    const calls = mockRun.mock.calls.map((call) => call[0]);

    expect(calls).toContain('echo "Deploying to production..."');
    expect(calls).not.toContain('echo "Deploying to staging..."');

    const workspace = (executor as any).workspace;
    expect(workspace.hasChoice('prod')).toBe(true);
    expect(workspace.hasChoice('staging')).toBe(false);
  });

  it('should verify step execution order', async () => {
    const workflow: Workflow = {
      steps: [
        {
          run: 'step1',
        },
        {
          choose: {
            message: 'Choose?',
            options: [{ id: 'opt1', label: 'Option 1' }],
            as: 'choice',
          },
        },
        {
          when: {
            var: {
              choice: 'opt1',
            },
          },
          run: 'step2',
        },
      ],
    };

    mockChoicePrompt.mockResolvedValueOnce({ id: 'opt1', label: 'Option 1' });

    await executor.execute(workflow);

    // Check execution order
    expect(mockRun.mock.calls[0][0]).toBe('step1');
    expect(mockRun.mock.calls[1][0]).toBe('step2');

    // step2 should execute after choice is set
    const workspace = (executor as any).workspace;
    expect(workspace.hasChoice('opt1')).toBe(true);
  });
});
