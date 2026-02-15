import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Workflow } from '@tp-types/workflow';
import { Executor } from '../executor';

// Mock TaskRunner
const mockRun = vi.fn();
vi.mock('../task-runner.js', () => {
  return {
    TaskRunner: vi.fn().mockImplementation(() => {
      return {
        run: mockRun,
      };
    }),
  };
});

describe('Timeout and Retry', () => {
  let executor: Executor;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new Executor();
  });

  describe('Timeout', () => {
    it('should pass timeout to TaskRunner', async () => {
      mockRun.mockResolvedValueOnce(true);

      const workflow: Workflow = {
        steps: [
          {
            run: 'echo "test"',
            timeout: 30, // 30 seconds
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
        30, // timeout should be passed
        undefined // shell
      );
    });

    it('should handle timeout when command exceeds limit', async () => {
      // Simulate timeout by returning false
      mockRun.mockResolvedValueOnce(false);

      const workflow: Workflow = {
        steps: [
          {
            run: 'sleep 100',
            timeout: 1, // 1 second timeout
          },
        ],
      };

      // Executor throws error on failure, which is expected
      await expect(executor.execute(workflow)).rejects.toThrow();

      expect(mockRun).toHaveBeenCalledWith(
        'sleep 100',
        expect.any(Number),
        'sleep 100',
        undefined,
        false,
        false,
        undefined,
        undefined,
        undefined,
        1, // timeout
        undefined // shell
      );
    });

    it('should work without timeout (undefined)', async () => {
      mockRun.mockResolvedValueOnce(true);

      const workflow: Workflow = {
        steps: [
          {
            run: 'echo "test"',
            // no timeout specified
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
        undefined, // timeout should be undefined
        undefined // shell
      );
    });
  });

  describe('Retry', () => {
    it('should retry on failure', async () => {
      // First attempt fails, second succeeds
      mockRun.mockResolvedValueOnce(false);
      mockRun.mockResolvedValueOnce(true);

      const workflow: Workflow = {
        steps: [
          {
            run: 'echo "test"',
            retry: 1, // Retry once
          },
        ],
      };

      await executor.execute(workflow);

      // Should be called twice (initial + 1 retry)
      expect(mockRun).toHaveBeenCalledTimes(2);
    });

    it('should retry multiple times', async () => {
      // First two attempts fail, third succeeds
      mockRun.mockResolvedValueOnce(false);
      mockRun.mockResolvedValueOnce(false);
      mockRun.mockResolvedValueOnce(true);

      const workflow: Workflow = {
        steps: [
          {
            run: 'echo "test"',
            retry: 2, // Retry twice
          },
        ],
      };

      await executor.execute(workflow);

      // Should be called 3 times (initial + 2 retries)
      expect(mockRun).toHaveBeenCalledTimes(3);
    });

    it('should stop retrying after success', async () => {
      // First attempt succeeds
      mockRun.mockResolvedValueOnce(true);

      const workflow: Workflow = {
        steps: [
          {
            run: 'echo "test"',
            retry: 5, // Even though retry is 5, should stop after success
          },
        ],
      };

      await executor.execute(workflow);

      // Should be called only once (success on first try)
      expect(mockRun).toHaveBeenCalledTimes(1);
    });

    it('should stop after max retries even if still failing', async () => {
      // All attempts fail
      mockRun.mockResolvedValue(false);

      const workflow: Workflow = {
        steps: [
          {
            run: 'echo "test"',
            retry: 2, // Retry twice
          },
        ],
      };

      // Executor throws error on failure after all retries, which is expected
      await expect(executor.execute(workflow)).rejects.toThrow();

      // Should be called 3 times (initial + 2 retries), then stop
      expect(mockRun).toHaveBeenCalledTimes(3);
    });

    it('should not retry if retry is 0', async () => {
      mockRun.mockResolvedValueOnce(false);

      const workflow: Workflow = {
        steps: [
          {
            run: 'echo "test"',
            retry: 0, // No retry
          },
        ],
      };

      // Executor throws error on failure, which is expected
      await expect(executor.execute(workflow)).rejects.toThrow();

      // Should be called only once
      expect(mockRun).toHaveBeenCalledTimes(1);
    });

    it('should not retry if retry is not specified', async () => {
      mockRun.mockResolvedValueOnce(false);

      const workflow: Workflow = {
        steps: [
          {
            run: 'echo "test"',
            // retry not specified
          },
        ],
      };

      // Executor throws error on failure, which is expected
      await expect(executor.execute(workflow)).rejects.toThrow();

      // Should be called only once (default: no retry)
      expect(mockRun).toHaveBeenCalledTimes(1);
    });
  });

  describe('Timeout and Retry Combined', () => {
    it('should support both timeout and retry', async () => {
      mockRun.mockResolvedValueOnce(false);
      mockRun.mockResolvedValueOnce(true);

      const workflow: Workflow = {
        steps: [
          {
            run: 'echo "test"',
            timeout: 30,
            retry: 1,
          },
        ],
      };

      await executor.execute(workflow);

      // Both timeout and retry should be passed
      expect(mockRun).toHaveBeenCalledTimes(2);
      expect(mockRun).toHaveBeenNthCalledWith(
        1,
        'echo "test"',
        expect.any(Number),
        'echo "test"',
        undefined,
        false,
        false,
        undefined,
        undefined,
        undefined,
        30, // timeout
        undefined // shell
      );
      expect(mockRun).toHaveBeenNthCalledWith(
        2,
        'echo "test"',
        expect.any(Number),
        'echo "test"',
        undefined,
        false,
        false,
        undefined,
        undefined,
        undefined,
        30, // timeout (same for retry)
        undefined // shell
      );
    });
  });

  describe('onError and continue', () => {
    it('should execute onError fallback when main run fails but still treat step as failed without continue', async () => {
      // Step 1: main fails, onError succeeds
      mockRun.mockResolvedValueOnce(false); // main command
      mockRun.mockResolvedValueOnce(true); // onError fallback

      const workflow: Workflow = {
        steps: [
          {
            run: 'node fail.js',
            onError: {
              run: 'echo "error"',
            },
          },
          {
            run: 'echo "done"',
          },
        ],
      };

      // Workflow should stop on first step failure because continue is not set
      await expect(executor.execute(workflow)).rejects.toThrow();

      // main + onError only (second step is never executed)
      expect(mockRun).toHaveBeenCalledTimes(2);
    });

    it('should continue workflow when run fails (with or without onError) and step-level continue is true', async () => {
      // Step 1: main fails, onError fails
      mockRun.mockResolvedValueOnce(false); // main command
      mockRun.mockResolvedValueOnce(false); // onError fallback
      // Step 2: succeeds
      mockRun.mockResolvedValueOnce(true);

      const workflow: Workflow = {
        steps: [
          {
            run: 'node fail.js',
            continue: true,
            onError: {
              run: 'echo "error"',
            },
          },
          {
            run: 'echo "done"',
          },
        ],
      };

      // Should not throw because continue: true at step level
      await expect(executor.execute(workflow)).resolves.not.toThrow();

      // main + onError + next step
      expect(mockRun).toHaveBeenCalledTimes(3);
    });

    it('should follow nested onError chain for side effects but keep step failed without continue', async () => {
      // main fails, first onError fails, second onError succeeds
      mockRun.mockResolvedValueOnce(false); // main
      mockRun.mockResolvedValueOnce(false); // onError level 1
      mockRun.mockResolvedValueOnce(true); // onError level 2

      const workflow: Workflow = {
        steps: [
          {
            run: 'step1',
            onError: {
              run: 'step2',
              onError: {
                run: 'step3',
              },
            },
          },
        ],
      };

      // Workflow should still fail because continue is not set at step level
      await expect(executor.execute(workflow)).rejects.toThrow();
      expect(mockRun).toHaveBeenCalledTimes(3);
    });

    it('should allow run failure without onError to continue when step-level continue is true', async () => {
      // Step 1: main fails, no onError
      mockRun.mockResolvedValueOnce(false);
      // Step 2: succeeds
      mockRun.mockResolvedValueOnce(true);

      const workflow: Workflow = {
        steps: [
          {
            run: 'node fail.js',
            continue: true,
          },
          {
            run: 'echo "done"',
          },
        ],
      };

      await expect(executor.execute(workflow)).resolves.not.toThrow();
      expect(mockRun).toHaveBeenCalledTimes(2);
    });

    it('should stop workflow when continue is false even if step succeeds', async () => {
      // Step 1: main succeeds
      mockRun.mockResolvedValueOnce(true);

      const workflow: Workflow = {
        steps: [
          {
            run: 'echo "done"',
            continue: false,
          },
          {
            run: 'echo "should not run"',
          },
        ],
      };

      // Workflow should stop even though step succeeded
      await expect(executor.execute(workflow)).rejects.toThrow();
      // Only first step should execute
      expect(mockRun).toHaveBeenCalledTimes(1);
    });

    it('should stop workflow when continue is false even if step fails', async () => {
      // Step 1: main fails
      mockRun.mockResolvedValueOnce(false);

      const workflow: Workflow = {
        steps: [
          {
            run: 'node fail.js',
            continue: false,
          },
          {
            run: 'echo "should not run"',
          },
        ],
      };

      // Workflow should stop on failure (continue: false)
      await expect(executor.execute(workflow)).rejects.toThrow();
      // Only first step should execute
      expect(mockRun).toHaveBeenCalledTimes(1);
    });

    it('should continue workflow when continue is true even if step succeeds', async () => {
      // Step 1: main succeeds
      mockRun.mockResolvedValueOnce(true);
      // Step 2: succeeds
      mockRun.mockResolvedValueOnce(true);

      const workflow: Workflow = {
        steps: [
          {
            run: 'echo "done"',
            continue: true,
          },
          {
            run: 'echo "next"',
          },
        ],
      };

      // Workflow should continue even with continue: true on success
      await expect(executor.execute(workflow)).resolves.not.toThrow();
      expect(mockRun).toHaveBeenCalledTimes(2);
    });
  });
});
