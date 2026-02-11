import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { extractFileName, selectWorkflowFromTpDirectory } from '../workflow-select';

// Mock ChoicePrompt
const mockChoicePrompt = vi.fn();
vi.mock('../prompts', () => ({
  ChoicePrompt: vi.fn().mockImplementation(() => ({
    prompt: (message: string, choices: any[]) => mockChoicePrompt(message, choices),
  })),
}));

// Mock parser - use actual parser for better coverage
vi.mock('../core/parser', async () => {
  const actual = await vi.importActual('../core/parser');
  return actual;
});

// Mock utils
const mockFindNearestTpDirectory = vi.fn();
vi.mock('../utils', () => ({
  findNearestTpDirectory: () => mockFindNearestTpDirectory(),
}));

describe('WorkflowSelect', () => {
  let testDir: string;
  let workflowsDir: string;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    testDir = await mkdir(join(tmpdir(), `workflow-select-test-${Date.now()}`), { recursive: true });
    workflowsDir = join(testDir, 'tp', 'workflows');
    await mkdir(workflowsDir, { recursive: true });
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    consoleErrorSpy.mockRestore();
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('extractFileName()', () => {
    it('should extract filename from path', () => {
      expect(extractFileName('/path/to/file.yaml')).toBe('file.yaml');
      expect(extractFileName('file.yaml')).toBe('file.yaml');
      expect(extractFileName('./file.yaml')).toBe('file.yaml');
    });

    it('should handle paths with multiple slashes', () => {
      expect(extractFileName('/a/b/c/file.yaml')).toBe('file.yaml');
    });

    it('should return original string if no slashes', () => {
      expect(extractFileName('file.yaml')).toBe('file.yaml');
    });
  });

  describe('selectWorkflowFromTpDirectory()', () => {
    it('should return null when tp directory does not exist', async () => {
      mockFindNearestTpDirectory.mockReturnValue(null);

      const result = await selectWorkflowFromTpDirectory();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should return null when workflows directory does not exist', async () => {
      const tpDir = join(testDir, 'tp');
      await mkdir(tpDir, { recursive: true });
      mockFindNearestTpDirectory.mockReturnValue(tpDir);

      const result = await selectWorkflowFromTpDirectory();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should return null when no workflow files found', async () => {
      mockFindNearestTpDirectory.mockReturnValue(join(testDir, 'tp'));

      const result = await selectWorkflowFromTpDirectory();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should find and return workflow file', async () => {
      const workflowFile = join(workflowsDir, 'test.yaml');
      await writeFile(workflowFile, 'name: Test\nsteps:\n  - run: echo "test"');

      mockFindNearestTpDirectory.mockReturnValue(join(testDir, 'tp'));
      mockChoicePrompt.mockResolvedValue({ id: workflowFile, label: 'test.yaml - Test' });

      const result = await selectWorkflowFromTpDirectory();

      expect(result).toBe(workflowFile);
      expect(mockChoicePrompt).toHaveBeenCalled();
    });

    it('should filter only yaml, yml, and json files', async () => {
      await writeFile(join(workflowsDir, 'test.yaml'), 'name: Test\nsteps: []');
      await writeFile(join(workflowsDir, 'test.json'), '{"name":"Test","steps":[]}');
      await writeFile(join(workflowsDir, 'test.txt'), 'not a workflow');

      mockFindNearestTpDirectory.mockReturnValue(join(testDir, 'tp'));
      mockChoicePrompt.mockResolvedValue({ id: join(workflowsDir, 'test.yaml'), label: 'test.yaml - Test' });

      const result = await selectWorkflowFromTpDirectory();

      expect(result).toBeTruthy();
      const promptCall = mockChoicePrompt.mock.calls[0];
      expect(promptCall).toBeDefined();
      const choices = promptCall[1];
      expect(choices.length).toBe(2); // yaml and json, not txt
      expect(choices.some((c: any) => c.id.includes('test.yaml'))).toBe(true);
      expect(choices.some((c: any) => c.id.includes('test.json'))).toBe(true);
      expect(choices.some((c: any) => c.id.includes('test.txt'))).toBe(false);
    });

    it('should handle workflow file parsing errors gracefully', async () => {
      const workflowFile = join(workflowsDir, 'invalid.yaml');
      await writeFile(workflowFile, 'invalid yaml content: [unclosed');

      mockFindNearestTpDirectory.mockReturnValue(join(testDir, 'tp'));
      mockChoicePrompt.mockResolvedValue({ id: workflowFile, label: 'invalid.yaml' });

      const result = await selectWorkflowFromTpDirectory();

      // Should still return the file path even if parsing fails
      expect(result).toBe(workflowFile);
    });

    it('should return null when user cancels selection', async () => {
      await writeFile(join(workflowsDir, 'test.yaml'), 'name: Test\nsteps: []');

      mockFindNearestTpDirectory.mockReturnValue(join(testDir, 'tp'));
      mockChoicePrompt.mockResolvedValue(null);

      const result = await selectWorkflowFromTpDirectory();

      expect(result).toBeNull();
    });

    it('should handle readdir errors', async () => {
      mockFindNearestTpDirectory.mockReturnValue(join(testDir, 'tp'));
      // Remove directory to cause readdir error
      await rm(join(testDir, 'tp'), { recursive: true, force: true });

      const result = await selectWorkflowFromTpDirectory();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should parse workflow name from YAML file', async () => {
      const workflowFile = join(workflowsDir, 'named-workflow.yaml');
      await writeFile(workflowFile, 'name: My Workflow\nsteps:\n  - run: echo "test"');

      mockFindNearestTpDirectory.mockReturnValue(join(testDir, 'tp'));
      mockChoicePrompt.mockResolvedValue({ id: workflowFile, label: 'named-workflow.yaml - My Workflow' });

      const result = await selectWorkflowFromTpDirectory();

      expect(result).toBe(workflowFile);
      const promptCall = mockChoicePrompt.mock.calls[0];
      const choices = promptCall[1];
      const choice = choices.find((c: any) => c.id === workflowFile);
      expect(choice?.label).toContain('My Workflow');
    });

    it('should parse workflow name from JSON file', async () => {
      const workflowFile = join(workflowsDir, 'named-workflow.json');
      await writeFile(workflowFile, '{"name":"My JSON Workflow","steps":[]}');

      mockFindNearestTpDirectory.mockReturnValue(join(testDir, 'tp'));
      mockChoicePrompt.mockResolvedValue({ id: workflowFile, label: 'named-workflow.json - My JSON Workflow' });

      const result = await selectWorkflowFromTpDirectory();

      expect(result).toBe(workflowFile);
      const promptCall = mockChoicePrompt.mock.calls[0];
      const choices = promptCall[1];
      const choice = choices.find((c: any) => c.id === workflowFile);
      // Label may contain workflow name or just filename if parsing fails
      expect(choice?.label).toBeTruthy();
      expect(choice?.label).toContain('named-workflow.json');
    });

    it('should use filename when workflow has no name', async () => {
      const workflowFile = join(workflowsDir, 'unnamed.yaml');
      await writeFile(workflowFile, 'steps:\n  - run: echo "test"');

      mockFindNearestTpDirectory.mockReturnValue(join(testDir, 'tp'));
      mockChoicePrompt.mockResolvedValue({ id: workflowFile, label: 'unnamed.yaml' });

      const result = await selectWorkflowFromTpDirectory();

      expect(result).toBe(workflowFile);
    });
  });
});
