import { readFileSync } from 'fs';
import { describe, it, expect, vi } from 'vitest';
import { parse } from 'yaml';
import { ConditionEvaluator } from '../condition-evaluator.js';
import { Executor } from '../executor.js';

// Simulate actual execution
describe('ACTUAL EXECUTION SIMULATION - Must Fix', () => {
  it('should execute basic.yaml EXACTLY as real execution', async () => {
    // 1. Load YAML file (same as actual)
    const content = readFileSync('examples/yaml-examples/basic.yaml', 'utf-8');
    const workflow = parse(content);
    
    // 2. Create Executor
    const executor = new Executor();
    const workspace = (executor as any).workspace;
    const choicePrompt = (executor as any).choicePrompt;
    const taskRunner = (executor as any).taskRunner;
    
    // 3. Simulate actual execution
    const executedCommands: string[] = [];
    const mockRun = vi.fn().mockImplementation((cmd: string) => {
      executedCommands.push(cmd);
      console.log(`[RUN] ${cmd}`);
      return Promise.resolve(true);
    });
    taskRunner.run = mockRun;
    
    // 4. Mock choice prompt (like actual inquirer)
    const mockPrompt = vi.fn().mockResolvedValue({ id: 'staging', label: 'Staging' });
    choicePrompt.prompt = mockPrompt;
    
    // Mock TextPrompt (prevent timeout)
    const textPrompt = (executor as any).textPrompt;
    textPrompt.prompt = vi.fn().mockResolvedValue('1.0.0');
    
    // 5. CI environment variable
    process.env.CI = 'false';
    
    try {
      // 6. Execute
      await executor.execute(workflow);
      
      // 7. Verify
      console.log('\n=== EXECUTION RESULT ===');
      console.log('Executed commands:', executedCommands);
      console.log('Workspace choices:', Array.from((workspace as any).state.choices.entries()));
      console.log('Workspace facts:', Array.from((workspace as any).state.facts.entries()));
      
      // Required verification
      expect(executedCommands).toContain('echo "Deploying to staging..."');
      expect(executedCommands).not.toContain('echo "Deploying to production..."');
      expect(workspace.hasChoice('staging')).toBe(true);
      
      // Verify each step
      expect(executedCommands[0]).toBe('echo "Building..."');
      expect(executedCommands).toContain('echo "Deploying to staging..."');
      
      console.log('\n✅ ALL CHECKS PASSED');
    } finally {
      delete process.env.CI;
    }
  });

  it('should verify choice is set BEFORE next step evaluation', async () => {
    const workflow = {
      steps: [
        {
          choose: {
            message: 'Choose?',
            options: [{ id: 'staging', label: 'Staging' }],
          },
        },
        {
          choose: {
            message: 'Choose?',
            options: [{ id: 'staging', label: 'Staging' }],
            as: 'env',
          },
        },
        {
          when: {
            var: {
              env: 'staging'
            }
          },
          run: 'echo "After choice"',
        },
      ],
    };

    const executor = new Executor();
    const workspace = (executor as any).workspace;
    const choicePrompt = (executor as any).choicePrompt;
    const taskRunner = (executor as any).taskRunner;
    
    const executedCommands: string[] = [];
    taskRunner.run = vi.fn().mockImplementation((cmd: string) => {
      executedCommands.push(cmd);
      return Promise.resolve(true);
    });
    
    choicePrompt.prompt = vi.fn()
      .mockResolvedValueOnce({ id: 'staging', label: 'Staging' })
      .mockResolvedValueOnce({ id: 'staging', label: 'Staging' });
    
    await executor.execute(workflow);
    
    // Check if choice is set
    expect(workspace.hasChoice('staging')).toBe(true);
    expect(executedCommands).toContain('echo "After choice"');
  });

  it('should manually trace step execution', async () => {
    const workflow = {
      steps: [
        { run: 'step1' },
        { choose: { message: 'Choose?', options: [{ id: 'opt1', label: 'Option 1' }], as: 'choice' } },
        { when: { var: { choice: 'opt1' } }, run: 'step3' },
      ],
    };

    const executor = new Executor();
    const workspace = (executor as any).workspace;
    const choicePrompt = (executor as any).choicePrompt;
    const taskRunner = (executor as any).taskRunner;
    
    const executedCommands: string[] = [];
    taskRunner.run = vi.fn().mockImplementation((cmd: string) => {
      executedCommands.push(cmd);
      console.log(`Executing: ${cmd}`);
      return Promise.resolve(true);
    });
    
    choicePrompt.prompt = vi.fn().mockResolvedValue({ id: 'opt1', label: 'Option 1' });
    
    // Step-by-step trace
    console.log('\n=== STEP BY STEP TRACE ===');
    
    // Step 0: run
    await (executor as any).executeStep(workflow.steps[0], { workspace, stepIndex: 0 });
    console.log('After step 0:', workspace.hasFact('fact1'));
    
    // Step 1: choose
    await (executor as any).executeChooseStep(workflow.steps[1], { workspace, stepIndex: 1 });
    console.log('After step 1 (choose):', workspace.hasChoice('opt1'));
    
    // Step 2: when + run
    const step2 = workflow.steps[2];
    if (step2 && 'when' in step2 && step2.when) {
      const evaluator = new ConditionEvaluator(workspace);
      const conditionResult = evaluator.evaluate(step2.when);
      console.log('Step 2 condition result:', conditionResult);
      
      if (conditionResult) {
        await (executor as any).executeRunStep(step2, { workspace, stepIndex: 2 });
      }
    } else if (step2) {
      await (executor as any).executeRunStep(step2, { workspace, stepIndex: 2 });
    }
    
    expect(executedCommands).toContain('step3');
  });
});

