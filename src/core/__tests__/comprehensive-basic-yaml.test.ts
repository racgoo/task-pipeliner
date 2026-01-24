import { readFileSync } from 'fs';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parse } from 'yaml';
import type { Workflow } from '../../types/workflow.js';
import { ConditionEvaluator } from '../condition-evaluator.js';
import { Executor } from '../executor.js';
import { Workspace } from '../workspace.js';

// Perfectly reproduce actual execution
describe('COMPREHENSIVE: Basic YAML - Must Work', () => {
  let executor: Executor;
  let executedCommands: string[];
  let _workspaceState: any[];

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new Executor();
    executedCommands = [];
    _workspaceState = [];

    // Mock TaskRunner
    const taskRunner = (executor as any).taskRunner;
    taskRunner.run = vi.fn().mockImplementation((cmd: string) => {
      executedCommands.push(cmd);
      console.log(`[EXEC] ${cmd}`);
      return Promise.resolve(true);
    });
    
    // Mock TextPrompt (prevent timeout)
    const textPrompt = (executor as any).textPrompt;
    textPrompt.prompt = vi.fn().mockResolvedValue('1.0.0');
  });

  afterEach(() => {
    const workspace = (executor as any).workspace;
    console.log('Final workspace state:');
    console.log('  Choices:', Array.from(workspace.state.choices.entries()));
    console.log('  Facts:', Array.from(workspace.state.facts.entries()));
  });

  it('MUST WORK: Complete basic.yaml execution with staging', async () => {
    const content = readFileSync('examples/yaml-examples/basic.yaml', 'utf-8');
    const workflow = parse(content) as Workflow;

    // Mock ChoicePrompt
    const choicePrompt = (executor as any).choicePrompt;
    choicePrompt.prompt = vi.fn().mockResolvedValue({ id: 'staging', label: 'Staging' });

    process.env.CI = 'false';

    try {
      await executor.execute(workflow);

      // Required verification
      expect(executedCommands).toContain('echo "Deploying to staging..."');
      expect(executedCommands).not.toContain('echo "Deploying to production..."');

      const workspace = (executor as any).workspace;
      expect(workspace.hasChoice('staging')).toBe(true);

      // Verify execution order
      const stagingIndex = executedCommands.indexOf('echo "Deploying to staging..."');
      expect(stagingIndex).toBeGreaterThan(-1);
      expect(stagingIndex).toBeGreaterThan(executedCommands.indexOf('echo "Building..."'));

      console.log('\n✅ TEST PASSED - All commands executed correctly');
    } finally {
      delete process.env.CI;
    }
  });

  it('MUST WORK: Step-by-step manual execution', async () => {
    const workflow: Workflow = {
      steps: [
        { run: 'step1' },
        { choose: { message: 'Choose?', options: [{ id: 's', label: 'S' }], as: 'choice' } },
        { when: { var: { choice: 's' } }, run: 'step3' },
      ],
    };

    // Use executor's actual workspace
    const workspace = (executor as any).workspace;
    const choicePrompt = (executor as any).choicePrompt;
    
    // Mock choicePrompt
    choicePrompt.prompt = vi.fn().mockResolvedValue({ id: 's', label: 'S' });

    // Step 0
    await (executor as any).executeRunStep(workflow.steps[0], { workspace, stepIndex: 0 });
    // f1 fact is not set if there's no sets/declares

    // Step 1 - executeChooseStep uses this.workspace
    await (executor as any).executeChooseStep(workflow.steps[1], { workspace, stepIndex: 1 });
    
    // Check if choicePrompt was called
    expect(choicePrompt.prompt).toHaveBeenCalled();
    
    // Check in executor's workspace
    const execWorkspace = (executor as any).workspace;
    console.log('Workspace choices after choose:', Array.from(execWorkspace.state.choices.entries()));
    expect(execWorkspace.hasChoice('s')).toBe(true);
    expect(execWorkspace.getVariable('choice')).toBe('s');

    // Step 2 - Condition evaluation (using executor's workspace)
    const step2 = workflow.steps[2];
    if (!step2.when) {
      throw new Error('Step 2 should have a when condition');
    }
    const evaluator = new ConditionEvaluator((executor as any).workspace);
    const result = evaluator.evaluate(step2.when);
    expect(result).toBe(true);

    // Step 2 - Execute
    if (result) {
      await (executor as any).executeRunStep(step2, { workspace: (executor as any).workspace, stepIndex: 2 });
    }

    expect(executedCommands).toContain('step3');
  });

  it('MUST WORK: Verify condition evaluation timing', async () => {
    const workspace = new Workspace();
    workspace.setVariable('env', 'staging');

    const evaluator = new ConditionEvaluator(workspace);
    const condition = {
      var: {
        env: 'staging'
      }
    };

    const result = evaluator.evaluate(condition);
    expect(result).toBe(true);
    expect(workspace.getVariable('env')).toBe('staging');
  });
});

