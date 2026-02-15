import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Workflow } from '@tp-types/workflow';
import { Executor } from '../executor';

describe('Shell Configuration', () => {
  let executor: Executor;
  let mockRun: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    executor = new Executor();
    const taskRunner = (executor as any).taskRunner;
    mockRun = vi.fn().mockResolvedValue(true);
    taskRunner.run = mockRun;
  });

  describe('Global shell configuration', () => {
    it('should pass global shell to taskRunner when workflow.shell is set', async () => {
      const workflow: Workflow = {
        shell: ['bash', '-lc'],
        steps: [{ run: 'echo "test"' }],
      };

      await executor.execute(workflow);

      expect(mockRun).toHaveBeenCalledWith(
        'echo "test"',
        expect.any(Number),
        'echo "test"',
        undefined,
        false,
        false,
        undefined,
        undefined,
        undefined,
        undefined,
        ['bash', '-lc'] // shell
      );
    });

    it('should use platform default when workflow.shell is not set', async () => {
      const workflow: Workflow = {
        steps: [{ run: 'echo "test"' }],
      };

      await executor.execute(workflow);

      expect(mockRun).toHaveBeenCalledWith(
        'echo "test"',
        expect.any(Number),
        'echo "test"',
        undefined,
        false,
        false,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined // shell is undefined, will use platform default
      );
    });
  });

  describe('Step-level shell configuration', () => {
    it('should override workflow.shell with step.shell', async () => {
      const workflow: Workflow = {
        shell: ['bash', '-c'],
        steps: [
          {
            run: 'echo "test"',
            shell: ['zsh', '-c'],
          },
        ],
      };

      await executor.execute(workflow);

      expect(mockRun).toHaveBeenCalledWith(
        'echo "test"',
        expect.any(Number),
        'echo "test"',
        undefined,
        false,
        false,
        undefined,
        undefined,
        undefined,
        undefined,
        ['zsh', '-c'] // step.shell overrides workflow.shell
      );
    });

    it('should use workflow.shell when step.shell is not set', async () => {
      const workflow: Workflow = {
        shell: ['bash', '-lc'],
        steps: [{ run: 'echo "step1"' }, { run: 'echo "step2"' }],
      };

      await executor.execute(workflow);

      expect(mockRun).toHaveBeenNthCalledWith(
        1,
        'echo "step1"',
        expect.any(Number),
        'echo "step1"',
        undefined,
        false,
        false,
        undefined,
        undefined,
        undefined,
        undefined,
        ['bash', '-lc']
      );

      expect(mockRun).toHaveBeenNthCalledWith(
        2,
        'echo "step2"',
        expect.any(Number),
        'echo "step2"',
        undefined,
        false,
        false,
        undefined,
        undefined,
        undefined,
        undefined,
        ['bash', '-lc']
      );
    });
  });

  describe('Shell validation', () => {
    it('should accept valid shell configuration', async () => {
      const workflow: Workflow = {
        shell: ['bash', '-lc'],
        steps: [{ run: 'echo "test"' }],
      };

      await expect(executor.execute(workflow)).resolves.not.toThrow();
    });

    it('should accept shell with single element', async () => {
      const workflow: Workflow = {
        shell: ['sh'],
        steps: [{ run: 'echo "test"' }],
      };

      await expect(executor.execute(workflow)).resolves.not.toThrow();
    });
  });
});
