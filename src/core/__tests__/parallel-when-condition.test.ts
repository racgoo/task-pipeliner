import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Workflow } from '@tp-types/workflow';
import { Executor } from '../executor';

// Mock TaskRunner
const mockRun = vi.fn();
vi.mock('../task-runner', () => ({
  TaskRunner: vi.fn().mockImplementation(() => ({
    run: mockRun,
    runRealtime: mockRun,
    displayBufferedOutput: vi.fn(),
  })),
}));

describe('Parallel with when condition - Bug Fix Test', () => {
  let executor: Executor;
  let choicePrompt: any;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new Executor();
    choicePrompt = (executor as any).choicePrompt;
    mockRun.mockResolvedValue({ success: true, stdout: '', stderr: '', exitCode: 0 });
  });

  it('MUST PASS: parallel block with when condition should execute when condition is met', async () => {
    const workflow: Workflow = {
      steps: [
        {
          run: 'echo "Starting Server"',
        },
        {
          choose: {
            message: 'Start Server with which environment?',
            options: [
              { id: 'dev', label: 'Development' },
              { id: 'hard-task', label: 'hard-task' },
            ],
            as: 'mode',
          },
        },
        {
          when: {
            var: {
              mode: 'dev',
            },
          },
          run: 'echo "dev mode"',
        },
        {
          parallel: [
            {
              when: {
                var: {
                  mode: 'hard-task',
                },
              },
              run: 'echo "hard-task mode"',
              timeout: 10,
              retry: 2,
            },
          ],
        },
      ],
    };

    // Mock choose to return 'hard-task'
    vi.spyOn(choicePrompt, 'prompt').mockResolvedValue({ id: 'hard-task', label: 'hard-task' });

    await executor.execute(workflow);

    const calls = mockRun.mock.calls.map((call) => call[0]);

    // Should execute starting server
    expect(calls).toContain('echo "Starting Server"');

    // Should NOT execute dev mode (condition not met)
    expect(calls).not.toContain('echo "dev mode"');

    // SHOULD execute hard-task mode (condition met)
    expect(calls).toContain('echo "hard-task mode"');
  });

  it('MUST PASS: parallel block with when condition should skip when condition is not met', async () => {
    const workflow: Workflow = {
      steps: [
        {
          choose: {
            message: 'Start Server with which environment?',
            options: [
              { id: 'dev', label: 'Development' },
              { id: 'hard-task', label: 'hard-task' },
            ],
            as: 'mode',
          },
        },
        {
          parallel: [
            {
              when: {
                var: {
                  mode: 'hard-task',
                },
              },
              run: 'echo "hard-task mode"',
            },
          ],
        },
      ],
    };

    // Mock choose to return 'dev' (not 'hard-task')
    vi.spyOn(choicePrompt, 'prompt').mockResolvedValue({ id: 'dev', label: 'Development' });

    await executor.execute(workflow);

    const calls = mockRun.mock.calls.map((call) => call[0]);

    // Should NOT execute hard-task mode (condition not met)
    expect(calls).not.toContain('echo "hard-task mode"');
  });

  it('MUST PASS: parallel block with multiple when conditions should only execute matching branches', async () => {
    const workflow: Workflow = {
      steps: [
        {
          choose: {
            message: 'Select mode',
            options: [
              { id: 'dev', label: 'dev' },
              { id: 'hard-task', label: 'hard-task' },
            ],
            as: 'mode',
          },
        },
        {
          parallel: [
            {
              when: {
                var: {
                  mode: 'hard-task',
                },
              },
              run: 'echo "hard-task mode"',
              timeout: 10,
              retry: 2,
            },
            {
              when: {
                var: {
                  mode: 'dev',
                },
              },
              run: 'echo "dev mode"',
              timeout: 10,
              retry: 2,
            },
          ],
        },
      ],
    };

    // Mock choose to return 'hard-task'
    vi.spyOn(choicePrompt, 'prompt').mockResolvedValue({ id: 'hard-task', label: 'hard-task' });

    await executor.execute(workflow);

    const calls = mockRun.mock.calls.map((call) => call[0]);

    // Should execute hard-task mode (condition met)
    expect(calls).toContain('echo "hard-task mode"');

    // Should NOT execute dev mode (condition not met)
    expect(calls).not.toContain('echo "dev mode"');
  });
});
