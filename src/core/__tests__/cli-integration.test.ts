import { readFileSync } from 'fs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parse } from 'yaml';
import type { Workflow } from '@tp-types/workflow';
import { Executor } from '../executor';

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

// Mock ChoicePrompt, TextPrompt
const mockChoicePrompt = vi.fn();
vi.mock('../../cli/prompts/index', () => {
  return {
    ChoicePrompt: vi.fn().mockImplementation(() => {
      return {
        prompt: mockChoicePrompt,
      };
    }),
    TextPrompt: vi.fn().mockImplementation(() => {
      return {
        prompt: vi.fn(),
      };
    }),
  };
});

describe('CLI Integration - Actual YAML Execution', () => {
  let executor: Executor;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new Executor();
  });

  it('should execute basic.yaml exactly as CLI would', async () => {
    // Load and parse YAML same way as CLI
    const content = readFileSync('examples/yaml-examples/basic.yaml', 'utf-8');
    const workflow = parse(content) as Workflow;

    // Verify YAML parsing result
    expect(workflow.steps).toBeDefined();
    expect(Array.isArray(workflow.steps)).toBe(true);
    expect(workflow.steps.length).toBeGreaterThan(0);

    // Select staging
    mockChoicePrompt.mockResolvedValueOnce({ id: 'staging', label: 'Staging' });

    // Execute same way as CLI
    await executor.execute(workflow);

    // Check executed commands
    const executedCommands = mockRun.mock.calls.map((call) => call[0]);

    // Verify required commands were executed
    expect(executedCommands).toContain('echo "Building..."');
    expect(executedCommands).toContain('echo "Deploying to staging..."');

    // Commands that should not be executed
    expect(executedCommands).not.toContain('echo "Deploying to production..."');

    // Check workspace state
    const workspace = (executor as any).workspace;
    expect(workspace.hasChoice('staging')).toBe(true);
    expect(workspace.getChoice('staging')).toBe('staging');

    console.log('✅ All assertions passed - workflow executed correctly');
  });

  it('should handle YAML parsing edge cases', async () => {
    // Check object structure after YAML parsing
    const content = readFileSync('examples/yaml-examples/basic.yaml', 'utf-8');
    const workflow = parse(content) as Workflow;

    // Check step types
    const chooseStep = workflow.steps.find((s) => 'choose' in s);
    expect(chooseStep).toBeDefined();
    if (!chooseStep) {
      throw new Error('chooseStep should exist');
    }
    expect('choose' in chooseStep).toBe(true);

    const runStepWithWhen = workflow.steps.find((s) => 'run' in s && 'when' in s);
    expect(runStepWithWhen).toBeDefined();
    if (!runStepWithWhen) {
      throw new Error('runStepWithWhen should exist');
    }
    expect('run' in runStepWithWhen).toBe(true);
    expect('when' in runStepWithWhen).toBe(true);
  });
});
