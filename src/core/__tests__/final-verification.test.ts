import { readFileSync } from 'fs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parse } from 'yaml';
import type { Workflow } from '../../types/workflow.js';
import { Executor } from '../executor.js';

// Final verification: Execute actual YAML files and verify all steps execute correctly
describe('FINAL VERIFICATION: Basic YAML Must Work', () => {
  let executor: Executor;
  let executedCommands: string[];

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new Executor();
    executedCommands = [];

    const taskRunner = (executor as any).taskRunner;
    taskRunner.run = vi.fn().mockImplementation((cmd: string) => {
      executedCommands.push(cmd);
      return Promise.resolve(true);
    });
    
    // Mock TextPrompt (prevent timeout)
    const textPrompt = (executor as any).textPrompt;
    textPrompt.prompt = vi.fn().mockResolvedValue('1.0.0');
  });

  it('FINAL TEST: basic.yaml with staging - ALL STEPS MUST EXECUTE', async () => {
    const content = readFileSync('examples/yaml-examples/basic.yaml', 'utf-8');
    const workflow = parse(content) as Workflow;

    const choicePrompt = (executor as any).choicePrompt;
    choicePrompt.prompt = vi.fn().mockResolvedValue({ id: 'staging', label: 'Staging' });

    await executor.execute(workflow);

    // Required verification - all of these must pass
    const requiredCommands = [
      'echo "Building..."',
      'echo "Deploying to staging..."',
    ];

    requiredCommands.forEach(cmd => {
      expect(executedCommands).toContain(cmd);
    });

    // Commands that should not be executed
    expect(executedCommands).not.toContain('echo "Deploying to production..."');

    // Verify workspace state
    const workspace = (executor as any).workspace;
    expect(workspace.hasChoice('staging')).toBe(true);
    expect(workspace.hasChoice('prod')).toBe(false);

    console.log('\n✅ FINAL TEST PASSED - All steps executed correctly');
    console.log('Executed commands:', executedCommands);
  });

  it('FINAL TEST: basic.yaml with prod - ALL STEPS MUST EXECUTE', async () => {
    const content = readFileSync('examples/yaml-examples/basic.yaml', 'utf-8');
    const workflow = parse(content) as Workflow;

    const choicePrompt = (executor as any).choicePrompt;
    choicePrompt.prompt = vi.fn().mockResolvedValue({ id: 'prod', label: 'Production' });

    await executor.execute(workflow);

    expect(executedCommands).toContain('echo "Deploying to production..."');
    expect(executedCommands).not.toContain('echo "Deploying to staging..."');

    const workspace = (executor as any).workspace;
    expect(workspace.hasChoice('prod')).toBe(true);
    expect(workspace.hasChoice('staging')).toBe(false);

    console.log('\n✅ FINAL TEST PASSED - Prod choice works correctly');
  });
});

