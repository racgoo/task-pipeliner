import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parse } from 'yaml';
import type { Workflow } from '../../types/workflow.js';
import { Executor } from '../executor.js';

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

describe('YAML Integration Tests', () => {
  let executor: Executor;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new Executor();
  });

  it('should execute basic.yaml workflow correctly - staging choice', async () => {
    const yamlContent = readFileSync('examples/yaml-examples/basic.yaml', 'utf-8');
    const workflow = parse(yamlContent) as Workflow;

    // Mock staging selection
    mockChoicePrompt.mockResolvedValueOnce({ id: 'staging', label: 'Staging' });

    await executor.execute(workflow);

    // All steps should be executed
    const calls = mockRun.mock.calls.map(call => call[0]);
    expect(calls).toContain('echo "Building..."');
    
    // Staging step should execute after staging is selected
    expect(calls).toContain('echo "Deploying to staging..."');
    
    // Prod step should not be executed
    expect(calls).not.toContain('echo "Deploying to production..."');
  });

  it('should execute basic.yaml workflow correctly - prod choice', async () => {
    const yamlContent = readFileSync('examples/yaml-examples/basic.yaml', 'utf-8');
    const workflow = parse(yamlContent) as Workflow;

    // Mock prod selection
    mockChoicePrompt.mockResolvedValueOnce({ id: 'prod', label: 'Production' });

    await executor.execute(workflow);

    // Prod step should execute after prod is selected
    const calls = mockRun.mock.calls.map(call => call[0]);
    expect(calls).toContain('echo "Deploying to production..."');
    
    // Staging step should not be executed
    expect(calls).not.toContain('echo "Deploying to staging..."');
  });

  it('should execute parallel.yaml workflow correctly', async () => {
    const yamlContent = readFileSync('examples/yaml-examples/parallel.yaml', 'utf-8');
    const workflow = parse(yamlContent) as Workflow;

    mockChoicePrompt.mockResolvedValueOnce({ id: 'blue_green', label: 'Blue-Green' });

    await executor.execute(workflow);

    // All parallel steps should be executed
    const calls = mockRun.mock.calls.map(call => call[0]);
    expect(calls).toContain('echo "Running web tests..."');
    expect(calls).toContain('echo "Running API tests..."');
    
    // Step execution based on selection
    expect(calls).toContain('echo "Deploying with blue-green strategy..."');
  });

  it('should verify workspace state after each step', async () => {
    const yamlContent = readFileSync('examples/yaml-examples/basic.yaml', 'utf-8');
    const workflow = parse(yamlContent) as Workflow;

    mockChoicePrompt.mockResolvedValueOnce({ id: 'staging', label: 'Staging' });

    await executor.execute(workflow);

    // Check workspace state
    const workspace = (executor as any).workspace;
    
    // Staging choice should be set
    expect(workspace.hasChoice('staging')).toBe(true);
    expect(workspace.getChoice('staging')).toBe('staging');
    
    // Prod choice should not be set
    expect(workspace.hasChoice('prod')).toBe(false);
  });

  it('should execute base-dir-example.yaml with baseDir correctly', async () => {
    const yamlContent = readFileSync('examples/yaml-examples/base-dir-example.yaml', 'utf-8');
    const workflow = parse(yamlContent) as Workflow;
    
    // Set file path for baseDir resolution
    workflow._filePath = resolve(process.cwd(), 'examples/yaml-examples/base-dir-example.yaml');

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
    mockRun.mock.calls.forEach(call => {
      expect(call[8]).toBe(expectedBaseDir); // cwd is 9th parameter (index 8)
    });
  });
});

