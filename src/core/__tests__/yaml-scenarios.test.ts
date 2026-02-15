import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Workflow } from '@tp-types/workflow';
import { Executor } from '../execution/executor';
import { createTestExecutor } from './test-helpers';

// Mock ChoicePrompt, TextPrompt
vi.mock('../../cli/prompts/index', () => {
  return {
    ChoicePrompt: vi.fn().mockImplementation(() => {
      return {
        prompt: vi.fn(),
      };
    }),
    TextPrompt: vi.fn().mockImplementation(() => {
      return {
        prompt: vi.fn(),
      };
    }),
  };
});

// Mock TaskRunner
const mockRun = vi.fn().mockResolvedValue(true);
vi.mock('@core/runtime/task-runner', () => {
  return {
    TaskRunner: vi.fn().mockImplementation(() => {
      return {
        run: mockRun,
        displayBufferedOutput: vi.fn(),
      };
    }),
  };
});

describe('YAML Scenario Tests', () => {
  let executor: Executor;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = createTestExecutor();
  });

  describe('basic.yaml', () => {
    it('should execute basic workflow with choice', async () => {
      const workflow: Workflow = {
        steps: [
          { run: 'echo "Building..."' },
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

      const choicePrompt = (executor as any).choicePrompt;
      choicePrompt.prompt = vi.fn().mockResolvedValue({ id: 'staging', label: 'Staging' });

      await executor.execute(workflow);

      const calls = mockRun.mock.calls.map((call) => call[0]);
      expect(calls).toContain('echo "Deploying to staging..."');
      expect(calls).not.toContain('echo "Deploying to production..."');
    });
  });

  describe('prompt.yaml', () => {
    it('should execute prompt workflow with variables', async () => {
      const workflow: Workflow = {
        steps: [
          {
            prompt: {
              message: 'What is your name?',
              as: 'user_name',
            },
          },
          {
            when: { var: 'user_name' },
            run: 'echo "Hello, {{user_name}}!"',
          },
          {
            prompt: {
              message: 'Enter version number:',
              as: 'version',
              default: '1.0.0',
            },
          },
          {
            when: { var: 'version' },
            run: 'echo "Building version {{version}}..."',
          },
        ],
      };

      const textPrompt = (executor as any).textPrompt;
      textPrompt.prompt = vi.fn().mockResolvedValueOnce('John').mockResolvedValueOnce('2.0.0');

      await executor.execute(workflow);

      const calls = mockRun.mock.calls.map((call) => call[0]);
      expect(calls).toContain('echo "Hello, John!"');
      expect(calls).toContain('echo "Building version 2.0.0..."');
    });
  });

  describe('parallel.yaml', () => {
    it('should execute parallel steps', async () => {
      const workflow: Workflow = {
        steps: [
          {
            parallel: [
              { run: 'echo "Running web tests..."' },
              { run: 'echo "Running API tests..."' },
            ],
          },
          {
            choose: {
              message: 'Deploy strategy?',
              options: [
                { id: 'blue_green', label: 'Blue-Green' },
                { id: 'rolling', label: 'Rolling' },
              ],
              as: 'strategy',
            },
          },
          {
            when: {
              var: {
                strategy: 'blue_green',
              },
            },
            run: 'echo "Deploying with blue-green strategy..."',
          },
        ],
      };

      const choicePrompt = (executor as any).choicePrompt;
      choicePrompt.prompt = vi.fn().mockResolvedValue({ id: 'blue_green', label: 'Blue-Green' });

      await executor.execute(workflow);

      const calls = mockRun.mock.calls.map((call) => call[0]);
      expect(calls).toContain('echo "Running web tests..."');
      expect(calls).toContain('echo "Running API tests..."');
      expect(calls).toContain('echo "Deploying with blue-green strategy..."');
    });
  });

  describe('conditions.yaml', () => {
    it('should check file existence', async () => {
      const workflow: Workflow = {
        steps: [
          {
            when: { file: 'package.json' },
            run: 'echo "Package.json exists"',
          },
          {
            when: {
              not: { file: 'nonexistent.txt' },
            },
            run: 'echo "File does not exist"',
          },
        ],
      };

      await executor.execute(workflow);

      const calls = mockRun.mock.calls.map((call) => call[0]);
      expect(calls).toContain('echo "Package.json exists"');
      expect(calls).toContain('echo "File does not exist"');
    });
  });

  describe('variables.yaml', () => {
    it('should use variables from prompts', async () => {
      const workflow: Workflow = {
        steps: [
          {
            prompt: {
              message: 'Enter project name:',
              as: 'project_name',
            },
          },
          {
            when: { var: 'project_name' },
            run: 'echo "Building {{project_name}}..."',
          },
        ],
      };

      const textPrompt = (executor as any).textPrompt;
      textPrompt.prompt = vi.fn().mockResolvedValue('my-app');

      await executor.execute(workflow);

      const calls = mockRun.mock.calls.map((call) => call[0]);
      expect(calls).toContain('echo "Building my-app..."');
    });
  });
});
