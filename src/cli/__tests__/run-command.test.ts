import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CliCommandError } from '../shared/command-runtime';

const mockExecute = vi.fn();
const mockParse = vi.fn();
const mockExtractStepLineNumbers = vi.fn();
const mockSelectWorkflow = vi.fn();
const mockParseVarPairs = vi.fn();
const mockSetSilentMode = vi.fn();
const mockExtractFileName = vi.fn();
const mockReadFileSync = vi.fn();

vi.mock('fs', () => ({
  readFileSync: (path: string, encoding: BufferEncoding) => mockReadFileSync(path, encoding),
}));

vi.mock('@core/execution/executor', () => ({
  Executor: vi.fn().mockImplementation(() => ({
    execute: (...args: unknown[]) => mockExecute(...args),
  })),
}));

vi.mock('@core/parsing/parser', () => ({
  getParser: vi.fn().mockImplementation(() => ({
    parse: (content: string) => mockParse(content),
    extractStepLineNumbers: (content: string) => mockExtractStepLineNumbers(content),
  })),
}));

vi.mock('../shared/utils', () => ({
  parseVarPairs: (pairs: string[]) => mockParseVarPairs(pairs),
  setSilentMode: () => mockSetSilentMode(),
}));

vi.mock('../prompts/workflow-select', () => ({
  selectWorkflowFromTpDirectory: () => mockSelectWorkflow(),
  extractFileName: (filePath: string) => mockExtractFileName(filePath),
}));

import { registerRunCommand } from '../commands/run';

describe('registerRunCommand', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockReadFileSync.mockReturnValue('steps: []');
    mockExtractStepLineNumbers.mockReturnValue(new Map([[0, 1]]));
    mockExtractFileName.mockReturnValue('workflow.yaml');
    mockParseVarPairs.mockReturnValue({ version: '2.0.0' });
    mockParse.mockReturnValue({
      steps: [{ run: 'echo hi' }],
      profiles: [{ name: 'Prod', var: { version: '1.0.0', env: 'prod' } }],
    });
    mockExecute.mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('executes workflow with profile and var override', async () => {
    const program = new Command();
    registerRunCommand(program);

    await program.parseAsync([
      'node',
      'tp',
      'run',
      'workflow.yaml',
      '--profile',
      'Prod',
      '-v',
      'version=2.0.0',
    ]);

    expect(mockParseVarPairs).toHaveBeenCalledWith(['version=2.0.0']);
    expect(mockSetSilentMode).not.toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalledTimes(1);

    const [workflow, options] = mockExecute.mock.calls[0];
    expect((workflow as { _filePath?: string })._filePath).toContain('workflow.yaml');
    expect((workflow as { _fileName?: string })._fileName).toBe('workflow.yaml');
    expect(options).toEqual({
      executionVars: { version: '2.0.0', env: 'prod' },
    });
  });

  it('uses workflow selector when file argument is omitted', async () => {
    mockSelectWorkflow.mockResolvedValue('tp/workflows/selected.yaml');

    const program = new Command();
    registerRunCommand(program);

    await program.parseAsync(['node', 'tp', 'run', '--silent']);

    expect(mockSelectWorkflow).toHaveBeenCalledTimes(1);
    expect(mockSetSilentMode).toHaveBeenCalledTimes(1);
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it('exits when no workflow is selected', async () => {
    mockSelectWorkflow.mockResolvedValue(null);

    const program = new Command();
    registerRunCommand(program);

    await expect(program.parseAsync(['node', 'tp', 'run'])).rejects.toBeInstanceOf(
      CliCommandError
    );
  });

  it('exits on invalid profile', async () => {
    mockParse.mockReturnValue({
      steps: [{ run: 'echo hi' }],
      profiles: [{ name: 'Dev', var: { env: 'dev' } }],
    });

    const program = new Command();
    registerRunCommand(program);

    await expect(
      program.parseAsync(['node', 'tp', 'run', 'workflow.yaml', '--profile', 'Prod'])
    ).rejects.toBeInstanceOf(CliCommandError);
  });

  it('exits on invalid var pair', async () => {
    mockParseVarPairs.mockImplementation(() => {
      throw new Error('Invalid -v/--var format');
    });

    const program = new Command();
    registerRunCommand(program);

    await expect(
      program.parseAsync(['node', 'tp', 'run', 'workflow.yaml', '-v', 'invalid'])
    ).rejects.toBeInstanceOf(CliCommandError);
  });

  it('exits when workflow has no steps array', async () => {
    mockParse.mockReturnValue({});

    const program = new Command();
    registerRunCommand(program);

    await expect(program.parseAsync(['node', 'tp', 'run', 'workflow.yaml'])).rejects.toBeInstanceOf(
      CliCommandError
    );
  });
});
