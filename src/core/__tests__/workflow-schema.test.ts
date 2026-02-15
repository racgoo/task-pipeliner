import { describe, it, expect } from 'vitest';
import { safeValidateWorkflow, validateWorkflow } from '../workflow/schema';

describe('WorkflowSchema', () => {
  describe('validateWorkflow() - valid workflows', () => {
    it('should validate minimal workflow', () => {
      const workflow = {
        steps: [{ run: 'echo "test"' }],
      };

      expect(() => validateWorkflow(workflow)).not.toThrow();
      const result = validateWorkflow(workflow);
      expect(result.steps).toHaveLength(1);
    });

    it('should validate workflow with name', () => {
      const workflow = {
        name: 'Test Workflow',
        steps: [{ run: 'echo "test"' }],
      };

      const result = validateWorkflow(workflow);
      expect(result.name).toBe('Test Workflow');
    });

    it('should validate workflow with baseDir', () => {
      const workflow = {
        baseDir: './src',
        steps: [{ run: 'echo "test"' }],
      };

      const result = validateWorkflow(workflow);
      expect(result.baseDir).toBe('./src');
    });

    it('should validate workflow with shell configuration', () => {
      const workflow = {
        shell: ['bash', '-lc'],
        steps: [{ run: 'echo "test"' }],
      };

      const result = validateWorkflow(workflow);
      expect(result.shell).toEqual(['bash', '-lc']);
    });

    it('should validate workflow with profiles', () => {
      const workflow = {
        steps: [{ run: 'echo "test"' }],
        profiles: [
          {
            name: 'Production',
            var: { env: 'prod', version: '1.0.0' },
          },
        ],
      };

      const result = validateWorkflow(workflow);
      expect(result.profiles).toHaveLength(1);
      expect(result.profiles?.[0].name).toBe('Production');
      expect(result.profiles?.[0].var.env).toBe('prod');
    });

    it('should coerce profile values to strings', () => {
      const workflow = {
        steps: [{ run: 'echo "test"' }],
        profiles: [
          {
            name: 'Test',
            var: { number: 123, boolean: true },
          },
        ],
      };

      const result = validateWorkflow(workflow);
      expect(result.profiles?.[0].var.number).toBe('123');
      expect(result.profiles?.[0].var.boolean).toBe('true');
    });
  });

  describe('validateWorkflow() - invalid workflows', () => {
    it('should throw error when steps array is missing', () => {
      const workflow = {};

      expect(() => validateWorkflow(workflow)).toThrow();
    });

    it('should throw error when steps array is empty', () => {
      const workflow = {
        steps: [],
      };

      expect(() => validateWorkflow(workflow)).toThrow('at least one step');
    });

    it('should throw error when shell array is empty', () => {
      const workflow = {
        shell: [],
        steps: [{ run: 'echo "test"' }],
      };

      expect(() => validateWorkflow(workflow)).toThrow();
    });

    it('should throw error when profile name is empty', () => {
      const workflow = {
        steps: [{ run: 'echo "test"' }],
        profiles: [
          {
            name: '',
            var: { test: 'value' },
          },
        ],
      };

      expect(() => validateWorkflow(workflow)).toThrow();
    });
  });

  describe('validateWorkflow() - step types', () => {
    it('should validate run step', () => {
      const workflow = {
        steps: [{ run: 'echo "test"' }],
      };

      expect(() => validateWorkflow(workflow)).not.toThrow();
    });

    it('should validate choose step', () => {
      const workflow = {
        steps: [
          {
            choose: {
              message: 'Select option',
              options: [
                { id: 'opt1', label: 'Option 1' },
                { id: 'opt2', label: 'Option 2' },
              ],
            },
          },
        ],
      };

      expect(() => validateWorkflow(workflow)).not.toThrow();
    });

    it('should validate prompt step', () => {
      const workflow = {
        steps: [
          {
            prompt: {
              message: 'Enter value',
              as: 'value',
            },
          },
        ],
      };

      expect(() => validateWorkflow(workflow)).not.toThrow();
    });

    it('should validate parallel step', () => {
      const workflow = {
        steps: [
          {
            parallel: [
              { run: 'echo "task1"' },
              { run: 'echo "task2"' },
            ],
          },
        ],
      };

      expect(() => validateWorkflow(workflow)).not.toThrow();
    });

    it('should validate fail step', () => {
      const workflow = {
        steps: [
          {
            fail: {
              message: 'Error occurred',
            },
          },
        ],
      };

      expect(() => validateWorkflow(workflow)).not.toThrow();
    });

    it('should reject choose step inside parallel', () => {
      const workflow = {
        steps: [
          {
            parallel: [
              { run: 'echo "task1"' },
              {
                choose: {
                  message: 'Select',
                  options: [{ id: 'opt1', label: 'Option 1' }],
                },
              },
            ],
          },
        ],
      };

      expect(() => validateWorkflow(workflow)).toThrow();
    });

    it('should reject prompt step inside parallel', () => {
      const workflow = {
        steps: [
          {
            parallel: [
              { run: 'echo "task1"' },
              {
                prompt: {
                  message: 'Enter value',
                  as: 'value',
                },
              },
            ],
          },
        ],
      };

      expect(() => validateWorkflow(workflow)).toThrow();
    });
  });

  describe('validateWorkflow() - run step options', () => {
    it('should validate run step with timeout', () => {
      const workflow = {
        steps: [
          {
            run: 'echo "test"',
            timeout: 30,
          },
        ],
      };

      expect(() => validateWorkflow(workflow)).not.toThrow();
    });

    it('should validate run step with retry', () => {
      const workflow = {
        steps: [
          {
            run: 'echo "test"',
            retry: 3,
          },
        ],
      };

      expect(() => validateWorkflow(workflow)).not.toThrow();
    });

    it('should validate run step with Infinity retry', () => {
      const workflow = {
        steps: [
          {
            run: 'echo "test"',
            retry: 'Infinity',
          },
        ],
      };

      expect(() => validateWorkflow(workflow)).not.toThrow();
    });

    it('should validate run step with continue flag', () => {
      const workflow = {
        steps: [
          {
            run: 'echo "test"',
            continue: true,
          },
        ],
      };

      expect(() => validateWorkflow(workflow)).not.toThrow();
    });

    it('should validate run step with onError', () => {
      const workflow = {
        steps: [
          {
            run: 'echo "test"',
            onError: {
              run: 'echo "fallback"',
            },
          },
        ],
      };

      expect(() => validateWorkflow(workflow)).not.toThrow();
    });

    it('should validate nested onError chain', () => {
      const workflow = {
        steps: [
          {
            run: 'echo "test"',
            onError: {
              run: 'echo "fallback1"',
              onError: {
                run: 'echo "fallback2"',
              },
            },
          },
        ],
      };

      expect(() => validateWorkflow(workflow)).not.toThrow();
    });

    it('should validate run step with captures', () => {
      const workflow = {
        steps: [
          {
            run: 'echo "test"',
            captures: [
              { as: 'output' },
              { regex: 'pattern', as: 'matched' },
              { json: '$.key', as: 'value' },
            ],
          },
        ],
      };

      expect(() => validateWorkflow(workflow)).not.toThrow();
    });
  });

  describe('safeValidateWorkflow()', () => {
    it('should return success=true for valid workflow', () => {
      const workflow = {
        steps: [{ run: 'echo "test"' }],
      };

      const result = safeValidateWorkflow(workflow);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return success=false for invalid workflow', () => {
      const workflow = {
        steps: [],
      };

      const result = safeValidateWorkflow(workflow);
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });
});

