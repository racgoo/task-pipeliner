import { readFileSync } from 'fs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parse } from 'yaml';
import type { Workflow } from '../../types/workflow';
import { Executor } from '../executor';

// Mock TaskRunner - actually execute echo commands
const mockRun = vi.fn().mockImplementation((command: string) => {
  console.log(`[EXECUTED] ${command}`);
  return Promise.resolve(true);
});

vi.mock('../task-runner.js', () => {
  return {
    TaskRunner: vi.fn().mockImplementation(() => {
      return {
        run: mockRun,
      };
    }),
  };
});

// Mock ChoicePrompt - behave like actual inquirer
const mockChoicePrompt = vi.fn();
vi.mock('../../cli/prompts.js', () => {
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

describe('DEBUG: Basic YAML Execution - Find the Bug', () => {
  let executor: Executor;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new Executor();
  });

  it('MUST PASS: Execute basic.yaml with staging choice and verify ALL steps run', async () => {
    // Load actual YAML file
    const content = readFileSync('examples/yaml-examples/basic.yaml', 'utf-8');
    const workflow = parse(content) as Workflow;

    console.log('\n=== Starting Workflow Execution ===');
    console.log(`Total steps: ${workflow.steps.length}`);

    // Mock staging selection
    mockChoicePrompt.mockResolvedValueOnce({ id: 'staging', label: 'Staging' });

    // Set CI environment variable
    const originalCI = process.env.CI;
    process.env.CI = 'false';

    try {
      await executor.execute(workflow);

      console.log('\n=== Execution Complete ===');
      console.log(`Total commands executed: ${mockRun.mock.calls.length}`);
      mockRun.mock.calls.forEach((call, i) => {
        console.log(`  ${i + 1}. ${call[0]}`);
      });

      // Check workspace state
      const workspace = (executor as any).workspace;
      console.log('\n=== Workspace State ===');
      console.log(`build_started fact: ${workspace.hasFact('build_started')}`);
      console.log(`staging choice: ${workspace.hasChoice('staging')}`);
      console.log(`prod choice: ${workspace.hasChoice('prod')}`);

      // Required verification: staging step must execute
      const executedCommands = mockRun.mock.calls.map((call) => call[0]);

      expect(executedCommands).toContain('echo "Building..."');

      // This is the key: staging step should execute
      expect(executedCommands).toContain('echo "Deploying to staging..."');

      // prod step should not execute
      expect(executedCommands).not.toContain('echo "Deploying to production..."');

      // Verify workspace state
      expect(workspace.hasChoice('staging')).toBe(true);
      expect(workspace.getChoice('staging')).toBe('staging');

      console.log('\n✅ ALL ASSERTIONS PASSED');
    } catch (error) {
      console.error('\n❌ TEST FAILED:', error);
      throw error;
    } finally {
      if (originalCI !== undefined) {
        process.env.CI = originalCI;
      } else {
        delete process.env.CI;
      }
    }
  });

  it('DEBUG: Step by step execution trace', async () => {
    const workflow: Workflow = {
      steps: [
        {
          run: 'echo "Step 1"',
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
              env: 'staging',
            },
          },
          run: 'echo "Step 3 - Staging"',
        },
      ],
    };

    mockChoicePrompt.mockResolvedValueOnce({ id: 'staging', label: 'Staging' });

    // Log workspace state before and after each step
    const workspace = (executor as any).workspace;

    await executor.execute(workflow);

    // Workspace state after Step 2 (choose)
    console.log('After choose step:');
    console.log('  hasChoice(staging):', workspace.hasChoice('staging'));
    console.log('  getChoice(staging):', workspace.getChoice('staging'));

    // Check if Step 3 executed
    const calls = mockRun.mock.calls.map((call) => call[0]);
    expect(calls).toContain('echo "Step 3 - Staging"');
  });
});
