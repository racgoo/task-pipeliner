import { existsSync } from 'fs';
import { mkdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerSetupCommand } from '../commands/setup';

describe('registerSetupCommand', () => {
  let testDir: string;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let cwdSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    testDir = await mkdir(join(tmpdir(), `tp-setup-test-${Date.now()}`), { recursive: true });
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(testDir);
  });

  afterEach(async () => {
    consoleLogSpy.mockRestore();
    cwdSpy.mockRestore();
    await rm(testDir, { recursive: true, force: true });
  });

  it('creates tp directories and example files', async () => {
    const program = new Command();
    registerSetupCommand(program);

    await program.parseAsync(['node', 'tp', 'setup']);

    expect(existsSync(join(testDir, 'tp'))).toBe(true);
    expect(existsSync(join(testDir, 'tp/workflows'))).toBe(true);
    expect(existsSync(join(testDir, 'tp/schedules'))).toBe(true);
  });

  it('is idempotent when setup is executed again', async () => {
    const program = new Command();
    registerSetupCommand(program);

    await program.parseAsync(['node', 'tp', 'setup']);
    await program.parseAsync(['node', 'tp', 'setup']);

    expect(existsSync(join(testDir, 'tp/workflows'))).toBe(true);
    expect(existsSync(join(testDir, 'tp/schedules'))).toBe(true);
  });
});
