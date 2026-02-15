import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrompt = vi.fn();
const mockIsDaemonRunning = vi.fn();
const mockGetDaemonStatus = vi.fn();
const mockStopDaemon = vi.fn();
const mockExistsSync = vi.fn();
const mockRm = vi.fn();

vi.mock('../prompts/index', () => ({
  ChoicePrompt: vi.fn().mockImplementation(() => ({
    prompt: (...args: unknown[]) => mockPrompt(...args),
  })),
}));

vi.mock('@core/scheduling/daemon-manager', () => ({
  isDaemonRunning: () => mockIsDaemonRunning(),
  getDaemonStatus: () => mockGetDaemonStatus(),
}));

vi.mock('../core-adapters', () => ({
  createCliScheduler: () => ({
    stopDaemon: () => mockStopDaemon(),
  }),
}));

vi.mock('fs', () => ({
  existsSync: (path: string) => mockExistsSync(path),
}));

vi.mock('fs/promises', () => ({
  rm: (...args: unknown[]) => mockRm(...args),
}));

vi.mock('os', () => ({
  homedir: () => '/mock-home',
}));

import { registerCleanCommand } from '../commands/clean';

describe('registerCleanCommand', () => {
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
    mockIsDaemonRunning.mockResolvedValue(false);
    mockExistsSync.mockReturnValue(true);
    mockPrompt.mockResolvedValue({ id: 'yes' });
    mockRm.mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('cancels when user does not confirm', async () => {
    mockPrompt.mockResolvedValue({ id: 'no' });

    const program = new Command();
    registerCleanCommand(program);

    await program.parseAsync(['node', 'tp', 'clean']);

    expect(mockRm).not.toHaveBeenCalled();
  });

  it('stops daemon and removes pipeliner directory when confirmed', async () => {
    mockIsDaemonRunning.mockResolvedValue(true);
    mockGetDaemonStatus.mockResolvedValue({ pid: 1234 });

    const program = new Command();
    registerCleanCommand(program);

    await program.parseAsync(['node', 'tp', 'clean']);

    expect(mockStopDaemon).toHaveBeenCalledTimes(1);
    expect(mockRm).toHaveBeenCalledWith('/mock-home/.pipeliner', { recursive: true });
  });

  it('shows already clean path when directory does not exist', async () => {
    mockExistsSync.mockReturnValue(false);

    const program = new Command();
    registerCleanCommand(program);

    await program.parseAsync(['node', 'tp', 'clean']);

    expect(mockRm).not.toHaveBeenCalled();
    expect(processExitSpy).not.toHaveBeenCalled();
  });
});
