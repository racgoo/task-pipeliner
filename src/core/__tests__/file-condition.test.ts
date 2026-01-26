import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Workflow } from '../../types/workflow';
import { ConditionEvaluator } from '../condition-evaluator';
import { Executor } from '../executor';
import { Workspace } from '../workspace';

// Mock ChoicePrompt, TextPrompt
vi.mock('../../cli/prompts.js', () => {
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
vi.mock('../task-runner.js', () => {
  return {
    TaskRunner: vi.fn().mockImplementation(() => {
      return {
        run: mockRun,
      };
    }),
  };
});

describe('File condition and choice-only when clauses', () => {
  let executor: Executor;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new Executor();
  });

  describe('file condition', () => {
    it('should check if file exists', () => {
      const workspace = new Workspace();
      const evaluator = new ConditionEvaluator(workspace);

      // Check actual file (package.json must exist)
      const condition = { file: 'package.json' };
      expect(evaluator.evaluate(condition)).toBe(true);
    });

    it('should return false when file does not exist', () => {
      const workspace = new Workspace();
      const evaluator = new ConditionEvaluator(workspace);

      const condition = { file: 'nonexistent-file-12345.txt' };
      expect(evaluator.evaluate(condition)).toBe(false);
    });

    it('should work with all condition', () => {
      const workspace = new Workspace();
      const evaluator = new ConditionEvaluator(workspace);

      const condition = {
        all: [{ file: 'package.json' }, { file: 'tsconfig.json' }],
      };
      expect(evaluator.evaluate(condition)).toBe(true);
    });

    it('should work with any condition', () => {
      const workspace = new Workspace();
      const evaluator = new ConditionEvaluator(workspace);

      const condition = {
        any: [{ file: 'package.json' }, { file: 'nonexistent-file.txt' }],
      };
      expect(evaluator.evaluate(condition)).toBe(true);
    });
  });

  describe('variable value comparison when clauses', () => {
    it('should execute step based on variable value', async () => {
      const workflow: Workflow = {
        steps: [
          {
            choose: {
              message: 'Choose?',
              options: [{ id: 'option1', label: 'Option 1' }],
              as: 'choice',
            },
          },
          {
            when: {
              var: {
                choice: 'option1',
              },
            },
            run: 'echo "Option 1 selected"',
          },
        ],
      };

      const choicePrompt = (executor as any).choicePrompt;
      choicePrompt.prompt = vi.fn().mockResolvedValue({ id: 'option1', label: 'Option 1' });

      await executor.execute(workflow);

      const calls = mockRun.mock.calls.map((call) => call[0]);
      expect(calls).toContain('echo "Option 1 selected"');
    });

    it('should skip step when variable value does not match', async () => {
      const workflow: Workflow = {
        steps: [
          {
            choose: {
              message: 'Choose?',
              options: [{ id: 'option1', label: 'Option 1' }],
              as: 'choice',
            },
          },
          {
            when: {
              var: {
                choice: 'option2',
              },
            },
            run: 'echo "This should not run"',
          },
        ],
      };

      const choicePrompt = (executor as any).choicePrompt;
      choicePrompt.prompt = vi.fn().mockResolvedValue({ id: 'option1', label: 'Option 1' });

      await executor.execute(workflow);

      const calls = mockRun.mock.calls.map((call) => call[0]);
      expect(calls).not.toContain('echo "This should not run"');
    });
  });

  describe('run step without sets/declares', () => {
    it('should execute run step without fact setting', async () => {
      const workflow: Workflow = {
        steps: [
          {
            run: 'echo "Step 1"',
          },
          {
            run: 'echo "Step 2"',
          },
        ],
      };

      await executor.execute(workflow);

      const calls = mockRun.mock.calls.map((call) => call[0]);
      expect(calls).toContain('echo "Step 1"');
      expect(calls).toContain('echo "Step 2"');
    });

    it('should stop workflow on step failure', async () => {
      let callCount = 0;
      mockRun.mockImplementation((_cmd: string) => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(false);
        }
        return Promise.resolve(true);
      });

      const workflow: Workflow = {
        steps: [
          {
            run: 'echo "This will fail"',
          },
          {
            run: 'echo "This should not run"',
          },
        ],
      };

      try {
        await executor.execute(workflow);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }

      const calls = mockRun.mock.calls.map((call) => call[0]);
      expect(calls).not.toContain('echo "This should not run"');

      // Restore to original
      mockRun.mockResolvedValue(true);
    });
  });
});
