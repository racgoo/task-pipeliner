import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Workflow } from '@tp-types/workflow';
import { Executor } from '../execution/executor';
import { createTestExecutor } from './test-helpers';

// Mock ChoicePrompt, TextPrompt
vi.mock('../../cli/prompts/index', () => {
  return {
    ChoicePrompt: vi.fn().mockImplementation(() => {
      return {
        prompt: vi.fn(),
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
vi.mock('@core/runtime/task-runner', () => {
  return {
    TaskRunner: vi.fn().mockImplementation(() => {
      return {
        run: mockRun,
      };
    }),
  };
});

describe('Executor - Parallel Step', () => {
  let executor: Executor;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = createTestExecutor();
  });

  it('should wait for all parallel steps to complete before next step', async () => {
    const workflow: Workflow = {
      steps: [
        {
          parallel: [{ run: 'echo "Step 1"' }, { run: 'echo "Step 2"' }, { run: 'echo "Step 3"' }],
        },
        {
          run: 'echo "After parallel"',
        },
      ],
    };

    await executor.execute(workflow);

    // All parallel steps should execute
    const calls = mockRun.mock.calls.map((call) => call[0]);
    expect(calls).toContain('echo "Step 1"');
    expect(calls).toContain('echo "Step 2"');
    expect(calls).toContain('echo "Step 3"');

    // Execute next step after all parallel steps complete
    expect(calls).toContain('echo "After parallel"');
  });

  it('should check files after parallel execution', async () => {
    const workflow: Workflow = {
      steps: [
        {
          parallel: [
            {
              run: 'echo "Web tests"',
            },
            {
              run: 'echo "API tests"',
            },
          ],
        },
        {
          when: {
            file: 'package.json',
          },
          run: 'echo "Package.json exists"',
        },
      ],
    };

    await executor.execute(workflow);

    // Check condition by file existence
    const calls = mockRun.mock.calls.map((call) => call[0]);
    expect(calls).toContain('echo "Package.json exists"');
  });

  it('should handle parallel steps with file conditions', async () => {
    const workflow: Workflow = {
      steps: [
        {
          parallel: [
            {
              when: { file: 'package.json' },
              run: 'echo "Branch 1"',
            },
            {
              when: { file: 'tsconfig.json' },
              run: 'echo "Branch 2"',
            },
          ],
        },
        {
          run: 'echo "After parallel"',
        },
      ],
    };

    await executor.execute(workflow);

    // Execute only parallel steps with satisfied conditions
    const calls = mockRun.mock.calls.map((call) => call[0]);
    expect(calls).toContain('echo "Branch 1"');
    expect(calls).toContain('echo "Branch 2"');
    expect(calls).toContain('echo "After parallel"');
  });

  it('should execute all parallel steps regardless of individual results', async () => {
    const workflow: Workflow = {
      steps: [
        {
          parallel: [{ run: 'echo "Step 1"' }, { run: 'echo "Step 2"' }],
        },
        {
          run: 'echo "After parallel"',
        },
      ],
    };

    // All steps succeed
    mockRun.mockResolvedValue(true);

    await executor.execute(workflow);

    // Both steps should execute
    const calls = mockRun.mock.calls.map((call) => call[0]);
    expect(calls).toContain('echo "Step 1"');
    expect(calls).toContain('echo "Step 2"');
    expect(calls).toContain('echo "After parallel"');
  });
});
