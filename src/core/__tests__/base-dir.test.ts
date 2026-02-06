import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parse } from 'yaml';
import type { Workflow } from '../../types/workflow';
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
const mockTextPrompt = vi.fn();
vi.mock('../../cli/prompts.js', () => {
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

describe('Base Directory Tests', () => {
  let executor: Executor;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new Executor();
  });

  it('should resolve relative baseDir against YAML file directory', async () => {
    const yamlContent = `name: Test
baseDir: ./examples
steps:
  - run: 'echo "test"'
`;

    const workflow = parse(yamlContent) as Workflow;
    // Simulate YAML file path
    workflow._filePath = resolve(process.cwd(), 'test-workflow.yaml');

    await executor.execute(workflow);

    // Check that baseDir was resolved correctly
    const expectedBaseDir = resolve(process.cwd(), 'examples');
    const actualBaseDir = (executor as any).baseDir;
    expect(actualBaseDir).toBe(expectedBaseDir);

    // Verify command was called with correct cwd
    expect(mockRun).toHaveBeenCalled();
    const lastCall = mockRun.mock.calls[mockRun.mock.calls.length - 1];
    expect(lastCall[8]).toBe(expectedBaseDir); // cwd is 9th parameter (index 8)
  });

  it('should use absolute baseDir as-is', async () => {
    const absolutePath = resolve(process.cwd(), 'examples');
    const yamlContent = `name: Test
baseDir: ${absolutePath}
steps:
  - run: 'echo "test"'
`;

    const workflow = parse(yamlContent) as Workflow;
    workflow._filePath = resolve(process.cwd(), 'test-workflow.yaml');

    await executor.execute(workflow);

    // Check that absolute baseDir was used as-is
    const actualBaseDir = (executor as any).baseDir;
    expect(actualBaseDir).toBe(absolutePath);

    // Verify command was called with correct cwd
    expect(mockRun).toHaveBeenCalled();
    const lastCall = mockRun.mock.calls[mockRun.mock.calls.length - 1];
    expect(lastCall[8]).toBe(absolutePath);
  });

  it('should fallback to current working directory if _filePath is not set', async () => {
    const yamlContent = `name: Test
baseDir: ./examples
steps:
  - run: 'echo "test"'
`;

    const workflow = parse(yamlContent) as Workflow;
    // Don't set _filePath

    await executor.execute(workflow);

    // Check that baseDir was resolved against cwd
    const expectedBaseDir = resolve(process.cwd(), 'examples');
    const actualBaseDir = (executor as any).baseDir;
    expect(actualBaseDir).toBe(expectedBaseDir);
  });

  it('should execute commands in baseDir when specified', async () => {
    const yamlContent = `name: Test
baseDir: ./examples
steps:
  - run: 'echo "test1"'
  - run: 'echo "test2"'
`;

    const workflow = parse(yamlContent) as Workflow;
    workflow._filePath = resolve(process.cwd(), 'test-workflow.yaml');

    await executor.execute(workflow);

    // All commands should be called with the same baseDir
    expect(mockRun).toHaveBeenCalledTimes(2);
    const expectedBaseDir = resolve(process.cwd(), 'examples');

    mockRun.mock.calls.forEach((call) => {
      expect(call[8]).toBe(expectedBaseDir);
    });
  });

  it('should work without baseDir (use current working directory)', async () => {
    const yamlContent = `name: Test
steps:
  - run: 'echo "test"'
`;

    const workflow = parse(yamlContent) as Workflow;

    await executor.execute(workflow);

    // baseDir should be workflow file directory
    const expectedBaseDir = dirname(workflowPath);
    const actualBaseDir = (executor as any).baseDir;
    expect(actualBaseDir).toBe(expectedBaseDir);

    // Command should be called with workflow file directory as cwd
    expect(mockRun).toHaveBeenCalled();
    const lastCall = mockRun.mock.calls[mockRun.mock.calls.length - 1];
    expect(lastCall[8]).toBe(expectedBaseDir);
  });

  it('should fallback to current working directory when baseDir and _filePath are not specified', async () => {
    const yamlContent = `name: Test
steps:
  - run: 'echo "test"'
`;

    const workflow = parse(yamlContent) as Workflow;
    // Don't set _filePath

    await executor.execute(workflow);

    // baseDir should be undefined (fallback to process.cwd())
    const actualBaseDir = (executor as any).baseDir;
    expect(actualBaseDir).toBeUndefined();

    // Command should be called with undefined cwd (defaults to current dir)
    expect(mockRun).toHaveBeenCalled();
    const lastCall = mockRun.mock.calls[mockRun.mock.calls.length - 1];
    expect(lastCall[8]).toBeUndefined();
  });

  it('should execute base-dir-example.yaml correctly', async () => {
    const yamlContent = readFileSync('examples/yaml-examples/base-dir-example.yaml', 'utf-8');
    const workflow = parse(yamlContent) as Workflow;
    workflow._filePath = resolve(process.cwd(), 'examples/yaml-examples/base-dir-example.yaml');

    await executor.execute(workflow);

    // Verify commands were executed
    expect(mockRun).toHaveBeenCalledTimes(2);

    // Verify baseDir was resolved correctly
    // baseDir is relative to YAML file directory, so it should be examples/examples
    // But since YAML file is in examples/, and baseDir is ./examples, it resolves to examples/examples
    // Actually, baseDir: ./examples means "examples directory relative to YAML file location"
    // Since YAML is in examples/, ./examples resolves to examples/examples
    // But the test expects examples/, so let's check what actually happens
    const yamlDir = dirname(workflow._filePath);
    const expectedBaseDir = resolve(yamlDir, 'examples');
    const actualBaseDir = (executor as any).baseDir;
    expect(actualBaseDir).toBe(expectedBaseDir);

    // Verify all commands used the correct cwd
    mockRun.mock.calls.forEach((call) => {
      expect(call[8]).toBe(expectedBaseDir);
    });
  });
});
