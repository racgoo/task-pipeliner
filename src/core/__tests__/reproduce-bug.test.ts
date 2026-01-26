import { readFileSync } from 'fs';
import { describe, expect, it, vi } from 'vitest';
import { parse } from 'yaml';
import type { Workflow } from '../../types/workflow';
import { Executor } from '../executor';

// Bug reproduction test: same environment as actual execution
describe('BUG REPRODUCTION: Choice condition not working', () => {
  it('REPRODUCE: Execute basic.yaml and verify staging step runs', async () => {
    const content = readFileSync('examples/yaml-examples/basic.yaml', 'utf-8');
    const workflow = parse(content) as Workflow;

    const executor = new Executor();
    const executed: string[] = [];

    // Use actual taskRunner
    const taskRunner = (executor as any).taskRunner;
    const originalRun = taskRunner.run.bind(taskRunner);
    taskRunner.run = vi.fn().mockImplementation(async (cmd: string) => {
      executed.push(cmd);
      console.log(`[EXEC] ${cmd}`);
      return await originalRun(cmd);
    });

    // Use actual choicePrompt (mocked)
    const choicePrompt = (executor as any).choicePrompt;
    choicePrompt.prompt = vi.fn().mockResolvedValue({ id: 'staging', label: 'Staging' });

    // Mock TextPrompt (prevent timeout)
    const textPrompt = (executor as any).textPrompt;
    textPrompt.prompt = vi.fn().mockResolvedValue('1.0.0');

    process.env.CI = 'false';

    try {
      // Execute
      await executor.execute(workflow);

      // Verify
      console.log('\n=== EXECUTION RESULT ===');
      console.log('Executed:', executed);
      console.log(
        'Workspace choices:',
        Array.from((executor as any).workspace.state.choices.entries())
      );

      // Required: staging step must execute
      expect(executed).toContain('echo "Deploying to staging..."');
      expect(executed).not.toContain('echo "Deploying to production..."');

      // Verify workspace
      const workspace = (executor as any).workspace;
      expect(workspace.hasChoice('staging')).toBe(true);
      expect(workspace.getChoice('staging')).toBe('staging');

      if (!executed.includes('echo "Deploying to staging..."')) {
        throw new Error('BUG REPRODUCED: staging step did not execute!');
      }
    } finally {
      delete process.env.CI;
    }
  });

  it('DEBUG: Trace exact execution flow', async () => {
    const workflow: Workflow = {
      steps: [
        { choose: { message: 'Choose?', options: [{ id: 'staging', label: 'S' }] } },
        { choose: { message: 'Choose?', options: [{ id: 'staging', label: 'S' }], as: 'env' } },
        { when: { var: { env: 'staging' } }, run: 'echo "Staging"' },
      ],
    };

    const executor = new Executor();
    const executed: string[] = [];

    const taskRunner = (executor as any).taskRunner;
    taskRunner.run = vi.fn().mockImplementation((cmd: string) => {
      executed.push(cmd);
      return Promise.resolve(true);
    });

    const choicePrompt = (executor as any).choicePrompt;
    choicePrompt.prompt = vi
      .fn()
      .mockResolvedValueOnce({ id: 'staging', label: 'S' })
      .mockResolvedValueOnce({ id: 'staging', label: 'S' });

    // Mock TextPrompt (prevent timeout)
    const textPrompt = (executor as any).textPrompt;
    textPrompt.prompt = vi.fn().mockResolvedValue('1.0.0');

    // Workspace state before execution
    const workspaceBefore = (executor as any).workspace;
    console.log('Before execution - choices:', Array.from(workspaceBefore.state.choices.entries()));

    await executor.execute(workflow);

    // Workspace state after execution
    const workspaceAfter = (executor as any).workspace;
    console.log('After execution - choices:', Array.from(workspaceAfter.state.choices.entries()));
    console.log('Executed commands:', executed);

    // Required verification
    expect(workspaceAfter.hasChoice('staging')).toBe(true);
    expect(executed).toContain('echo "Staging"');
  });
});
