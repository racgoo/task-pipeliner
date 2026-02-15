import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CliCommandError } from '../shared/command-runtime';

const { mockExecAsync } = vi.hoisted(() => ({
  mockExecAsync: vi.fn(),
}));

vi.mock('util', () => ({
  promisify: () => mockExecAsync,
}));

import { registerOpenCommand } from '../commands/open';

describe('registerOpenCommand', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let platformSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin');
    mockExecAsync.mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    platformSpy.mockRestore();
  });

  it('opens docs with platform-specific command', async () => {
    const program = new Command();
    registerOpenCommand(program);

    await program.parseAsync(['node', 'tp', 'open', 'docs']);

    expect(mockExecAsync).toHaveBeenCalledWith('open "https://task-pipeliner.racgoo.com/"');
  });

  it('exits when target is invalid', async () => {
    const program = new Command();
    registerOpenCommand(program);

    await expect(program.parseAsync(['node', 'tp', 'open', 'invalid'])).rejects.toBeInstanceOf(
      CliCommandError
    );
  });

  it('exits when browser open fails', async () => {
    mockExecAsync.mockRejectedValue(new Error('spawn failed'));

    const program = new Command();
    registerOpenCommand(program);

    await expect(
      program.parseAsync(['node', 'tp', 'open', 'generator'])
    ).rejects.toBeInstanceOf(CliCommandError);
  });
});
