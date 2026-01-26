import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChoicePrompt } from '../../cli/prompts';
import type { Workflow } from '../../types/workflow';
import { Executor } from '../executor';

// Use actual ChoicePrompt and TextPrompt (without mocking)

// Mock only TaskRunner
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

describe('Executor - Choice Integration Test (Real Prompts)', () => {
  let executor: Executor;
  let choicePrompt: ChoicePrompt;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new Executor();
    choicePrompt = (executor as any).choicePrompt;
  });

  it('should execute step after choice is made - REAL PROMPT', async () => {
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

    // Mock the actual prompt but use real ChoicePrompt instance
    vi.spyOn(choicePrompt, 'prompt').mockResolvedValue({ id: 'staging', label: 'Staging' });

    await executor.execute(workflow);

    // staging step should execute after staging is selected
    const calls = mockRun.mock.calls.map((call) => call[0]);
    expect(calls).toContain('echo "Deploying to staging..."');
    expect(calls).not.toContain('echo "Deploying to production..."');

    // Check if choice and variable are set in workspace
    const workspace = (executor as any).workspace;
    expect(workspace.hasChoice('staging')).toBe(true);
    expect(workspace.getVariable('env')).toBe('staging');
  });

  it('should verify workspace state after choice', async () => {
    const workflow: Workflow = {
      steps: [
        {
          choose: {
            message: 'Select option',
            options: [{ id: 'option1', label: 'Option 1' }],
          },
        },
      ],
    };

    const choicePrompt = (executor as any).choicePrompt;
    vi.spyOn(choicePrompt, 'prompt').mockResolvedValue({ id: 'option1', label: 'Option 1' });

    await executor.execute(workflow);

    const workspace = (executor as any).workspace;

    // Check if choice is set
    expect(workspace.hasChoice('option1')).toBe(true);
    expect(workspace.getChoice('option1')).toBe('option1');
  });

  it('MUST PASS: choose with as keyword, then multiple when clauses (bug fix scenario)', async () => {
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

    // Test with dev
    vi.spyOn(choicePrompt, 'prompt').mockResolvedValue({ id: 'dev', label: 'dev' });
    await executor.execute(workflow);

    const calls = mockRun.mock.calls.map((call) => call[0]);
    expect(calls).toContain('echo "DEV selected"');
    expect(calls).not.toContain('echo "BUILD selected"');
    expect(calls).not.toContain('echo "ECHO selected"');

    // Verify variable is stored correctly
    const workspace = (executor as any).workspace;
    expect(workspace.getVariable('optionType')).toBe('dev');
  });

  it('MUST PASS: choose with as keyword, then when clause with non-matching value', async () => {
    const workflow: Workflow = {
      steps: [
        {
          choose: {
            message: 'Select option:',
            options: [
              { id: 'dev', label: 'dev' },
              { id: 'build', label: 'build' },
            ],
            as: 'optionType',
          },
        },
        {
          when: {
            var: {
              optionType: 'build',
            },
          },
          run: 'echo "BUILD selected"',
        },
      ],
    };

    // Select dev, but condition checks for build
    vi.spyOn(choicePrompt, 'prompt').mockResolvedValue({ id: 'dev', label: 'dev' });
    await executor.execute(workflow);

    const calls = mockRun.mock.calls.map((call) => call[0]);
    expect(calls).not.toContain('echo "BUILD selected"');

    // Verify variable is stored but condition didn't match
    const workspace = (executor as any).workspace;
    expect(workspace.getVariable('optionType')).toBe('dev');
  });
});
