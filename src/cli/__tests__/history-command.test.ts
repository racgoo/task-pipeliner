import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrimaryPrompt = vi.fn();
const mockSearchablePrompt = vi.fn();
const mockGetHistoryNames = vi.fn();
const mockGetHistory = vi.fn();
const mockRemoveHistory = vi.fn();
const mockClearAllHistories = vi.fn();
const mockDisplayHistory = vi.fn();

vi.mock('../prompts/index', () => ({
  ChoicePrompt: vi.fn().mockImplementation((searchable?: boolean) => ({
    prompt: searchable
      ? (...args: unknown[]) => mockSearchablePrompt(...args)
      : (...args: unknown[]) => mockPrimaryPrompt(...args),
  })),
}));

vi.mock('@core/history/manager', () => ({
  WorkflowHistoryManager: vi.fn().mockImplementation(() => ({
    getHistoryNames: () => mockGetHistoryNames(),
    getHistory: (name: string) => mockGetHistory(name),
    removeHistory: (name: string) => mockRemoveHistory(name),
    clearAllHistories: () => mockClearAllHistories(),
  })),
}));

vi.mock('../history/display', () => ({
  displayHistory: (...args: unknown[]) => mockDisplayHistory(...args),
}));

import { registerHistoryCommand } from '../commands/history';

describe('registerHistoryCommand', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as never);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('shows selected history', async () => {
    mockPrimaryPrompt.mockResolvedValue({ id: 'show' });
    mockGetHistoryNames.mockResolvedValue(['history-1']);
    mockSearchablePrompt.mockResolvedValue({ id: 'history-1' });
    mockGetHistory.mockResolvedValue({ records: [], initialTimestamp: new Date().toISOString() });

    const program = new Command();
    registerHistoryCommand(program);

    await program.parseAsync(['node', 'tp', 'history']);

    expect(mockGetHistory).toHaveBeenCalledWith('history-1');
    expect(mockDisplayHistory).toHaveBeenCalledTimes(1);
  });

  it('handles remove-all cancellation', async () => {
    mockPrimaryPrompt.mockResolvedValueOnce({ id: 'remove-all' }).mockResolvedValueOnce({ id: 'no' });

    const program = new Command();
    registerHistoryCommand(program);

    await program.parseAsync(['node', 'tp', 'history']);

    expect(mockClearAllHistories).not.toHaveBeenCalled();
  });

  it('exits on invalid action choice', async () => {
    mockPrimaryPrompt.mockResolvedValue({});

    const program = new Command();
    registerHistoryCommand(program);

    await expect(program.parseAsync(['node', 'tp', 'history'])).rejects.toThrow('process.exit');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
