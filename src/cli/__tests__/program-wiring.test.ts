import { describe, expect, it } from 'vitest';
import { createProgram } from '../index';

describe('createProgram', () => {
  it('registers top-level commands in expected order', () => {
    const program = createProgram();
    const commandNames = program.commands.map((cmd) => cmd.name());

    expect(commandNames).toEqual(['run', 'open', 'schedule', 'setup', 'history', 'clean']);
  });

  it('registers run command options', () => {
    const program = createProgram();
    const runCommand = program.commands.find((cmd) => cmd.name() === 'run');

    expect(runCommand).toBeDefined();
    const optionFlags = runCommand?.options.map((option) => option.flags) ?? [];

    expect(optionFlags).toContain('-s, --silent');
    expect(optionFlags).toContain('-p, --profile <name>');
    expect(optionFlags).toContain('-v, --var <pair>');
  });

  it('keeps global help text content', () => {
    const program = createProgram();
    const helpText = program.helpInformation();

    expect(helpText).toContain('A powerful task pipeline runner with condition-based workflow execution.');
    expect(helpText).toContain('Quick Start:');
    expect(helpText).toContain('tp open docs');
    expect(helpText).toContain('tp clean');
  });
});
