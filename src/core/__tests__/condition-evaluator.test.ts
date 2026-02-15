import { describe, it, expect } from 'vitest';
import type { Condition } from '@tp-types/condition';
import { ConditionEvaluator } from '../condition-evaluator';
import { Workspace } from '../workspace';

describe('ConditionEvaluator', () => {
  describe('variable value comparison', () => {
    it('should evaluate variable value comparison correctly', () => {
      const workspace = new Workspace();
      workspace.setVariable('env', 'staging');

      const evaluator = new ConditionEvaluator(workspace);
      const condition: Condition = {
        var: {
          env: 'staging',
        },
      };

      expect(evaluator.evaluate(condition)).toBe(true);
    });

    it('should return false when variable value does not match', () => {
      const workspace = new Workspace();
      workspace.setVariable('env', 'staging');

      const evaluator = new ConditionEvaluator(workspace);
      const condition: Condition = {
        var: {
          env: 'prod',
        },
      };

      expect(evaluator.evaluate(condition)).toBe(false);
    });

    it('should return false when variable does not exist', () => {
      const workspace = new Workspace();

      const evaluator = new ConditionEvaluator(workspace);
      const condition: Condition = {
        var: {
          env: 'staging',
        },
      };

      expect(evaluator.evaluate(condition)).toBe(false);
    });

    it('MUST PASS: should return false when variable is undefined (bug fix test)', () => {
      const workspace = new Workspace();
      // Variable is not set at all

      const evaluator = new ConditionEvaluator(workspace);
      const condition: Condition = {
        var: {
          optionType: 'dev',
        },
      };

      // Should return false, not throw error or return true
      expect(evaluator.evaluate(condition)).toBe(false);
    });

    it('MUST PASS: should correctly compare variable values with different types', () => {
      const workspace = new Workspace();
      workspace.setVariable('optionType', 'dev');

      const evaluator = new ConditionEvaluator(workspace);

      // Match
      expect(evaluator.evaluate({ var: { optionType: 'dev' } })).toBe(true);
      // No match
      expect(evaluator.evaluate({ var: { optionType: 'build' } })).toBe(false);
      expect(evaluator.evaluate({ var: { optionType: 'echo' } })).toBe(false);
    });

    it('MUST PASS: should handle multiple variable comparisons correctly', () => {
      const workspace = new Workspace();
      workspace.setVariable('env', 'staging');
      workspace.setVariable('version', '2.0.0');

      const evaluator = new ConditionEvaluator(workspace);

      // All match
      expect(
        evaluator.evaluate({
          var: {
            env: 'staging',
            version: '2.0.0',
          },
        })
      ).toBe(true);

      // One doesn't match
      expect(
        evaluator.evaluate({
          var: {
            env: 'staging',
            version: '1.0.0',
          },
        })
      ).toBe(false);

      // One variable doesn't exist
      expect(
        evaluator.evaluate({
          var: {
            env: 'staging',
            nonexistent: 'value',
          },
        })
      ).toBe(false);
    });

    it('should evaluate variable value in all condition', () => {
      const workspace = new Workspace();
      workspace.setVariable('env', 'staging');

      const evaluator = new ConditionEvaluator(workspace);
      const condition: Condition = {
        all: [
          {
            var: {
              env: 'staging',
            },
          },
          { file: 'package.json' },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(true);
    });

    it('should evaluate variable value in any condition', () => {
      const workspace = new Workspace();
      workspace.setVariable('env', 'staging');

      const evaluator = new ConditionEvaluator(workspace);
      const condition: Condition = {
        any: [
          {
            var: {
              env: 'staging',
            },
          },
          {
            var: {
              env: 'prod',
            },
          },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(true);
    });
  });

  describe('file condition', () => {
    it('should evaluate file exists condition', () => {
      const workspace = new Workspace();
      const evaluator = new ConditionEvaluator(workspace);

      // Check actual file (package.json must exist)
      const condition: Condition = { file: 'package.json' };
      expect(evaluator.evaluate(condition)).toBe(true);
    });

    it('should return false when file does not exist', () => {
      const workspace = new Workspace();
      const evaluator = new ConditionEvaluator(workspace);

      const condition: Condition = { file: 'nonexistent-file-12345.txt' };
      expect(evaluator.evaluate(condition)).toBe(false);
    });

    it('should work with file in all condition', () => {
      const workspace = new Workspace();
      const evaluator = new ConditionEvaluator(workspace);

      const condition: Condition = {
        all: [{ file: 'package.json' }, { file: 'tsconfig.json' }],
      };
      expect(evaluator.evaluate(condition)).toBe(true);
    });

    it('should work with file in any condition', () => {
      const workspace = new Workspace();
      const evaluator = new ConditionEvaluator(workspace);

      const condition: Condition = {
        any: [{ file: 'package.json' }, { file: 'nonexistent-file.txt' }],
      };
      expect(evaluator.evaluate(condition)).toBe(true);
    });

    it('should work with not file condition', () => {
      const workspace = new Workspace();
      const evaluator = new ConditionEvaluator(workspace);

      const condition: Condition = {
        not: { file: 'nonexistent-file-12345.txt' },
      };
      expect(evaluator.evaluate(condition)).toBe(true);
    });
  });
});
