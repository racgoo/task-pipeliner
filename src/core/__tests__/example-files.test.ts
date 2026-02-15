import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parse } from 'yaml';
import type { Workflow } from '@tp-types/workflow';
import { Executor } from '../execution/executor';
import { createTestExecutor } from './test-helpers';

// Mock ChoicePrompt, TextPrompt
const mockChoicePrompt = vi.fn();
const mockTextPrompt = vi.fn();

vi.mock('../../cli/prompts/index', () => {
  return {
    ChoicePrompt: vi.fn().mockImplementation(() => {
      return {
        prompt: mockChoicePrompt,
      };
    }),
    TextPrompt: vi.fn().mockImplementation(() => {
      return {
        prompt: mockTextPrompt,
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

function loadExampleFile(filename: string): Workflow {
  const filePath = join(process.cwd(), 'examples', 'yaml-examples', filename);
  const content = readFileSync(filePath, 'utf-8');
  const workflow = parse(content) as Workflow;

  // Track line numbers (simple version)
  const lineNumbers = new Map<number, number>();
  const lines = content.split('\n');
  let stepIndex = 0;
  let inSteps = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === 'steps:' || trimmed.startsWith('steps:')) {
      inSteps = true;
      continue;
    }

    if (!inSteps) continue;

    if (trimmed.startsWith('-')) {
      lineNumbers.set(stepIndex, i + 1);
      stepIndex++;
    }
  }

  workflow._lineNumbers = lineNumbers;

  // Store file name and absolute path
  workflow._fileName = filename;
  workflow._filePath = resolve(filePath);

  return workflow;
}

describe('Example Files Integration Tests', () => {
  let executor: Executor;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = createTestExecutor();
  });

  describe('basic.yaml', () => {
    it('should execute basic workflow correctly', async () => {
      const workflow = loadExampleFile('basic.yaml');

      mockChoicePrompt.mockResolvedValueOnce({ id: 'staging', label: 'Staging' });

      await executor.execute(workflow);

      const calls = mockRun.mock.calls.map((call) => call[0]);
      expect(calls).toContain('echo "Deploying to staging..."');
    });
  });

  describe('prompt.yaml', () => {
    it('should execute prompt workflow correctly', async () => {
      const workflow = loadExampleFile('prompt.yaml');

      mockTextPrompt
        .mockResolvedValueOnce('John')
        .mockResolvedValueOnce('1.0.0')
        .mockResolvedValueOnce('Production deployment');
      mockChoicePrompt.mockResolvedValueOnce({ id: 'prod', label: 'Production' });

      await executor.execute(workflow);

      const calls = mockRun.mock.calls.map((call) => call[0]);
      expect(calls).toContain('echo "Hello, John!"');
      expect(calls).toContain('echo "Building version 1.0.0..."');
      expect(calls).toContain('echo "Deploying..."');
    });
  });

  describe('parallel.yaml', () => {
    it('should execute parallel workflow correctly', async () => {
      const workflow = loadExampleFile('parallel.yaml');

      mockChoicePrompt.mockResolvedValueOnce({ id: 'blue_green', label: 'Blue-Green' });

      await executor.execute(workflow);

      const calls = mockRun.mock.calls.map((call) => call[0]);
      expect(calls).toContain('echo "Running web tests..."');
      expect(calls).toContain('echo "Running API tests..."');
      expect(calls).toContain('echo "Deploying with blue-green strategy..."');
    });
  });

  describe('conditions.yaml', () => {
    it('should execute conditions workflow correctly', async () => {
      const workflow = loadExampleFile('conditions.yaml');

      mockChoicePrompt.mockResolvedValueOnce({ id: 'prod', label: 'Production' });
      mockTextPrompt.mockResolvedValueOnce('test-project');

      // This will fail at the end because ./dist doesn't exist, which is expected
      try {
        await executor.execute(workflow);
      } catch (error) {
        // Expected to fail when dist directory is missing
        expect(error instanceof Error).toBe(true);
        expect((error as Error).message).toBe('Build output not found');
      }

      // Verify some steps executed before the failure
      const calls = mockRun.mock.calls.map((call) => call[0]);
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  describe('variables.yaml', () => {
    it('should execute variables workflow correctly', async () => {
      const workflow = loadExampleFile('variables.yaml');

      mockTextPrompt
        .mockResolvedValueOnce('my-app')
        .mockResolvedValueOnce('1.0.0')
        .mockResolvedValueOnce('Production release');
      mockChoicePrompt.mockResolvedValueOnce({ id: 'prod', label: 'Production' });

      await executor.execute(workflow);

      const calls = mockRun.mock.calls.map((call) => call[0]);
      expect(calls).toContain('echo "Building my-app..."');
      expect(calls).toContain('echo "Building my-app version 1.0.0..."');
    });
  });

  describe('file-checks.yaml', () => {
    it('should execute file checks workflow correctly', async () => {
      const workflow = loadExampleFile('file-checks.yaml');

      // Use prod choice to avoid dev environment file check failure
      mockChoicePrompt.mockResolvedValueOnce({ id: 'prod', label: 'Production' });

      // This will fail because .env.production doesn't exist, which is expected
      try {
        await executor.execute(workflow);
      } catch (error) {
        // Expected to fail when config file is missing
        expect(error instanceof Error).toBe(true);
      }

      // Verify some steps executed before the failure
      const calls = mockRun.mock.calls.map((call) => call[0]);
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  describe('cicd.yaml', () => {
    it('should execute CI/CD workflow correctly', async () => {
      const workflow = loadExampleFile('cicd.yaml');

      // Create required directories for file checks
      const distPath = join(process.cwd(), 'dist');
      const testResultsPath = join(process.cwd(), 'test-results');
      if (!existsSync(distPath)) {
        mkdirSync(distPath, { recursive: true });
      }
      if (!existsSync(testResultsPath)) {
        mkdirSync(testResultsPath, { recursive: true });
      }

      mockChoicePrompt.mockResolvedValueOnce({ id: 'staging', label: 'Staging' });

      await executor.execute(workflow);

      const calls = mockRun.mock.calls.map((call) => call[0]);
      expect(calls).toContain('echo "Deploying to staging..."');
    });
  });

  describe('base-dir-example.yaml', () => {
    it('should execute baseDir workflow correctly', async () => {
      const workflow = loadExampleFile('base-dir-example.yaml');

      await executor.execute(workflow);

      // Verify commands were executed
      expect(mockRun).toHaveBeenCalledTimes(2);

      // Verify baseDir was resolved correctly
      // baseDir is relative to YAML file directory (examples/), so ./examples resolves to examples/examples
      if (!workflow._filePath) {
        throw new Error('_filePath should be set');
      }
      const yamlDir = dirname(workflow._filePath);
      const expectedBaseDir = resolve(yamlDir, 'examples');
      const actualBaseDir = (executor as any).baseDir;
      expect(actualBaseDir).toBe(expectedBaseDir);

      // Verify all commands used the correct cwd
      mockRun.mock.calls.forEach((call) => {
        expect(call[8]).toBe(expectedBaseDir); // cwd is 9th parameter (index 8)
      });

      const calls = mockRun.mock.calls.map((call) => call[0]);
      expect(calls).toContain('echo "Working in baseDir: $(pwd)"');
      expect(calls).toContain('ls -la | head -5');
    });
  });
});
