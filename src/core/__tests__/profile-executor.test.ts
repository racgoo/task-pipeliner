import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Workflow } from '@tp-types/workflow';
import { Executor } from '../executor';

const mockChoicePrompt = vi.fn();
const mockTextPrompt = vi.fn();
vi.mock('../../cli/prompts/index', () => ({
  ChoicePrompt: vi.fn().mockImplementation(() => ({ prompt: mockChoicePrompt })),
  TextPrompt: vi.fn().mockImplementation(() => ({ prompt: mockTextPrompt })),
}));

const mockRun = vi.fn().mockResolvedValue(true);
vi.mock('../task-runner.js', () => ({
  TaskRunner: vi.fn().mockImplementation(() => ({ run: mockRun })),
}));

describe('Executor - Profile (profileVars)', () => {
  let executor: Executor;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new Executor();
  });

  it('should seed workspace with profileVars and skip choose step when variable is set', async () => {
    const workflow: Workflow = {
      steps: [
        {
          choose: {
            message: 'Select mode',
            options: [
              { id: 'dev', label: 'Development' },
              { id: 'prod', label: 'Production' },
            ],
            as: 'mode',
          },
        },
        {
          run: 'echo "selected mode: {{ mode }}"',
        },
      ],
    };

    await executor.execute(workflow, {
      executionVars: { mode: 'dev' },
    });

    // Choice prompt must not be called (skipped by profile)
    expect(mockChoicePrompt).not.toHaveBeenCalled();
    // Run step should have substituted variable
    expect(mockRun).toHaveBeenCalled();
    expect(mockRun.mock.calls[0][0]).toBe('echo "selected mode: dev"');
  });

  it('should skip prompt step when variable is set in profileVars', async () => {
    const workflow: Workflow = {
      steps: [
        {
          prompt: {
            message: 'Enter label',
            as: 'label',
            default: 'default-label',
          },
        },
        {
          run: 'echo "label is {{ label }}"',
        },
      ],
    };

    await executor.execute(workflow, {
      executionVars: { label: 'profile-label' },
    });

    // Text prompt must not be called (skipped by profile)
    expect(mockTextPrompt).not.toHaveBeenCalled();
    expect(mockRun).toHaveBeenCalled();
    expect(mockRun.mock.calls[0][0]).toBe('echo "label is profile-label"');
  });

  it('should skip both choose and prompt when profileVars set for both', async () => {
    const workflow: Workflow = {
      steps: [
        {
          choose: {
            message: 'Select mode',
            options: [
              { id: 'dev', label: 'Dev' },
              { id: 'prod', label: 'Prod' },
            ],
            as: 'mode',
          },
        },
        {
          prompt: {
            message: 'Enter name',
            as: 'name',
          },
        },
        {
          run: 'echo "{{ mode }} / {{ name }}"',
        },
      ],
    };

    await executor.execute(workflow, {
      executionVars: { mode: 'prod', name: 'alice' },
    });

    expect(mockChoicePrompt).not.toHaveBeenCalled();
    expect(mockTextPrompt).not.toHaveBeenCalled();
    expect(mockRun).toHaveBeenCalled();
    expect(mockRun.mock.calls[0][0]).toBe('echo "prod / alice"');
  });

  it('should still prompt for variables not in profileVars', async () => {
    const workflow: Workflow = {
      steps: [
        {
          choose: {
            message: 'Select mode',
            options: [
              { id: 'dev', label: 'Dev' },
              { id: 'prod', label: 'Prod' },
            ],
            as: 'mode',
          },
        },
        {
          prompt: {
            message: 'Enter extra',
            as: 'extra',
          },
        },
        {
          run: 'echo "{{ mode }} {{ extra }}"',
        },
      ],
    };

    mockTextPrompt.mockResolvedValueOnce('typed-extra');

    await executor.execute(workflow, {
      executionVars: { mode: 'dev' },
    });

    // Choose skipped (mode in profile), prompt still called (extra not in profile)
    expect(mockChoicePrompt).not.toHaveBeenCalled();
    expect(mockTextPrompt).toHaveBeenCalledWith('Enter extra', undefined);
    expect(mockRun).toHaveBeenCalled();
    expect(mockRun.mock.calls[0][0]).toBe('echo "dev typed-extra"');
  });

  it('should not skip choose when profile value is not a valid option id', async () => {
    const workflow: Workflow = {
      steps: [
        {
          choose: {
            message: 'Select mode',
            options: [
              { id: 'dev', label: 'Dev' },
              { id: 'prod', label: 'Prod' },
            ],
            as: 'mode',
          },
        },
        {
          run: 'echo "{{ mode }}"',
        },
      ],
    };

    mockChoicePrompt.mockResolvedValueOnce({ id: 'prod', label: 'Prod' });

    await executor.execute(workflow, {
      executionVars: { mode: 'invalid-option' },
    });

    // Profile value "invalid-option" is not in option ids -> prompt is shown
    expect(mockChoicePrompt).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenCalled();
    expect(mockRun.mock.calls[0][0]).toBe('echo "prod"');
  });

  it('should run without profileVars and call prompts as usual', async () => {
    const workflow: Workflow = {
      steps: [
        {
          choose: {
            message: 'Select',
            options: [{ id: 'a', label: 'A' }],
            as: 'x',
          },
        },
        {
          run: 'echo "{{ x }}"',
        },
      ],
    };

    mockChoicePrompt.mockResolvedValueOnce({ id: 'a', label: 'A' });

    await executor.execute(workflow);

    expect(mockChoicePrompt).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenCalled();
    expect(mockRun.mock.calls[0][0]).toBe('echo "a"');
  });

  it('should run with empty profileVars and not change behavior', async () => {
    const workflow: Workflow = {
      steps: [
        {
          prompt: {
            message: 'Enter value',
            as: 'v',
          },
        },
        {
          run: 'echo "{{ v }}"',
        },
      ],
    };

    mockTextPrompt.mockResolvedValueOnce('user-value');

    await executor.execute(workflow, { executionVars: {} });

    expect(mockTextPrompt).toHaveBeenCalledWith('Enter value', undefined);
    expect(mockRun).toHaveBeenCalled();
    expect(mockRun.mock.calls[0][0]).toBe('echo "user-value"');
  });
});
