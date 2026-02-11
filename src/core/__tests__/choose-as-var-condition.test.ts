import { mkdir } from 'fs/promises';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Workflow } from '../../types/workflow';
import { ConditionEvaluator } from '../condition-evaluator';
import { Executor } from '../executor';
import { WORKFLOW_HISTORY_DIR } from '../history';
import { Workspace } from '../workspace';

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

describe('Choose with "as" keyword and var condition - Bug Fix Test', () => {
  let executor: Executor;
  let choicePrompt: any;
  let textPrompt: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Ensure history directory exists
    try {
      await mkdir(WORKFLOW_HISTORY_DIR, { recursive: true });
    } catch {
      // Ignore if already exists
    }
    executor = new Executor();
    choicePrompt = (executor as any).choicePrompt;
    textPrompt = (executor as any).textPrompt;
  });

  afterEach(async () => {
    // Cleanup is handled by other tests if needed
  });

  /**
   * This test reproduces the exact bug scenario:
   * 1. choose with 'as' keyword stores variable
   * 2. prompt stores another variable
   * 3. Multiple when clauses check var conditions
   * 4. Only the matching when clause should execute
   */
  it('MUST PASS: choose with as keyword, then multiple when clauses with var conditions', async () => {
    const workflow: Workflow = {
      steps: [
        {
          choose: {
            message: 'Select option type:',
            options: [
              { id: 'dev', label: 'dev' },
              { id: 'build', label: 'build' },
              { id: 'echo', label: 'echo' },
            ],
            as: 'optionType',
          },
        },
        {
          prompt: {
            message: 'Enter your name value:',
            as: 'name',
          },
        },
        {
          run: 'echo "Hello,2 {{name}}!"',
        },
        {
          when: {
            var: {
              optionType: 'dev',
            },
          },
          run: 'yarn run dev',
        },
        {
          when: {
            var: {
              optionType: 'build',
            },
          },
          run: 'yarn build',
        },
        {
          when: {
            var: {
              optionType: 'echo',
            },
          },
          run: 'echo "Your name is {{name}}!"',
        },
      ],
    };

    // Mock prompts
    vi.spyOn(choicePrompt, 'prompt').mockResolvedValue({ id: 'dev', label: 'dev' });
    vi.spyOn(textPrompt, 'prompt').mockResolvedValue('John');

    await executor.execute(workflow);

    // Verify only 'dev' step executed
    const calls = mockRun.mock.calls.map((call) => call[0]);
    expect(calls).toContain('echo "Hello,2 John!"');
    expect(calls).toContain('yarn run dev');
    expect(calls).not.toContain('yarn build');
    expect(calls).not.toContain('echo "Your name is John!"');

    // Verify workspace state
    const workspace = (executor as any).workspace;
    expect(workspace.getVariable('optionType')).toBe('dev');
    expect(workspace.getVariable('name')).toBe('John');
  });

  it('MUST PASS: choose with as keyword, select build option', async () => {
    const workflow: Workflow = {
      steps: [
        {
          choose: {
            message: 'Select option type:',
            options: [
              { id: 'dev', label: 'dev' },
              { id: 'build', label: 'build' },
              { id: 'echo', label: 'echo' },
            ],
            as: 'optionType',
          },
        },
        {
          when: {
            var: {
              optionType: 'dev',
            },
          },
          run: 'echo "DEV selected"',
        },
        {
          when: {
            var: {
              optionType: 'build',
            },
          },
          run: 'echo "BUILD selected"',
        },
        {
          when: {
            var: {
              optionType: 'echo',
            },
          },
          run: 'echo "ECHO selected"',
        },
      ],
    };

    vi.spyOn(choicePrompt, 'prompt').mockResolvedValue({ id: 'build', label: 'build' });

    await executor.execute(workflow);

    const calls = mockRun.mock.calls.map((call) => call[0]);
    expect(calls).not.toContain('echo "DEV selected"');
    expect(calls).toContain('echo "BUILD selected"');
    expect(calls).not.toContain('echo "ECHO selected"');
  });

  it('MUST PASS: choose with as keyword, select echo option', async () => {
    const workflow: Workflow = {
      steps: [
        {
          choose: {
            message: 'Select option type:',
            options: [
              { id: 'dev', label: 'dev' },
              { id: 'build', label: 'build' },
              { id: 'echo', label: 'echo' },
            ],
            as: 'optionType',
          },
        },
        {
          prompt: {
            message: 'Enter your name value:',
            as: 'name',
          },
        },
        {
          when: {
            var: {
              optionType: 'echo',
            },
          },
          run: 'echo "Your name is {{name}}!"',
        },
      ],
    };

    vi.spyOn(choicePrompt, 'prompt').mockResolvedValue({ id: 'echo', label: 'echo' });
    vi.spyOn(textPrompt, 'prompt').mockResolvedValue('Alice');

    await executor.execute(workflow);

    const calls = mockRun.mock.calls.map((call) => call[0]);
    expect(calls).toContain('echo "Your name is Alice!"');
  });

  it('MUST PASS: condition evaluator handles undefined variable correctly', () => {
    const workspace = new Workspace();
    const evaluator = new ConditionEvaluator(workspace);

    // Variable doesn't exist
    const condition = {
      var: {
        optionType: 'dev',
      },
    };

    expect(evaluator.evaluate(condition)).toBe(false);
  });

  it('MUST PASS: condition evaluator compares variable value correctly', () => {
    const workspace = new Workspace();
    workspace.setVariable('optionType', 'dev');
    const evaluator = new ConditionEvaluator(workspace);

    // Match
    expect(evaluator.evaluate({ var: { optionType: 'dev' } })).toBe(true);
    // No match
    expect(evaluator.evaluate({ var: { optionType: 'build' } })).toBe(false);
    expect(evaluator.evaluate({ var: { optionType: 'echo' } })).toBe(false);
  });

  it('MUST PASS: multiple when clauses with different variable values', async () => {
    const workflow: Workflow = {
      steps: [
        {
          choose: {
            message: 'Select environment:',
            options: [
              { id: 'dev', label: 'Development' },
              { id: 'staging', label: 'Staging' },
              { id: 'prod', label: 'Production' },
            ],
            as: 'env',
          },
        },
        {
          when: {
            var: {
              env: 'dev',
            },
          },
          run: 'echo "Development environment"',
        },
        {
          when: {
            var: {
              env: 'staging',
            },
          },
          run: 'echo "Staging environment"',
        },
        {
          when: {
            var: {
              env: 'prod',
            },
          },
          run: 'echo "Production environment"',
        },
      ],
    };

    // Test dev
    vi.clearAllMocks();
    vi.spyOn(choicePrompt, 'prompt').mockResolvedValue({ id: 'dev', label: 'Development' });
    await executor.execute(workflow);
    let calls = mockRun.mock.calls.map((call) => call[0]);
    expect(calls).toContain('echo "Development environment"');
    expect(calls).not.toContain('echo "Staging environment"');
    expect(calls).not.toContain('echo "Production environment"');

    // Test staging
    executor = new Executor();
    choicePrompt = (executor as any).choicePrompt;
    vi.clearAllMocks();
    vi.spyOn(choicePrompt, 'prompt').mockResolvedValue({ id: 'staging', label: 'Staging' });
    await executor.execute(workflow);
    calls = mockRun.mock.calls.map((call) => call[0]);
    expect(calls).not.toContain('echo "Development environment"');
    expect(calls).toContain('echo "Staging environment"');
    expect(calls).not.toContain('echo "Production environment"');

    // Test prod
    executor = new Executor();
    choicePrompt = (executor as any).choicePrompt;
    vi.clearAllMocks();
    vi.spyOn(choicePrompt, 'prompt').mockResolvedValue({ id: 'prod', label: 'Production' });
    await executor.execute(workflow);
    calls = mockRun.mock.calls.map((call) => call[0]);
    expect(calls).not.toContain('echo "Development environment"');
    expect(calls).not.toContain('echo "Staging environment"');
    expect(calls).toContain('echo "Production environment"');
  });

  it('MUST PASS: choose without as keyword still works with var condition', async () => {
    const workflow: Workflow = {
      steps: [
        {
          choose: {
            message: 'Select option:',
            options: [
              { id: 'option1', label: 'Option 1' },
              { id: 'option2', label: 'Option 2' },
            ],
            // No 'as' keyword - should store as choice id
          },
        },
        {
          when: {
            var: {
              option1: 'option1',
            },
          },
          run: 'echo "Option 1 selected"',
        },
        {
          when: {
            var: {
              option2: 'option2',
            },
          },
          run: 'echo "Option 2 selected"',
        },
      ],
    };

    vi.spyOn(choicePrompt, 'prompt').mockResolvedValue({ id: 'option1', label: 'Option 1' });

    await executor.execute(workflow);

    const calls = mockRun.mock.calls.map((call) => call[0]);
    expect(calls).toContain('echo "Option 1 selected"');
    expect(calls).not.toContain('echo "Option 2 selected"');
  });
});
