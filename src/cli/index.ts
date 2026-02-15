#!/usr/bin/env node

/**
 * CLI Entry Point
 */

import { Command } from 'commander';
import { registerCleanCommand } from './commands/clean';
import { registerHistoryCommand } from './commands/history';
import { registerOpenCommand } from './commands/open';
import { applyProgramMetadata } from './commands/program-metadata';
import { registerRunCommand } from './commands/run';
import { registerSetupCommand } from './commands/setup';
import { createScheduleCommand } from './schedule/index';
import { getVersion } from './shared/utils';

export function createProgram(): Command {
  const program = new Command();

  applyProgramMetadata(program, getVersion());

  registerRunCommand(program);
  registerOpenCommand(program);

  /**
   * Schedule command group
   * Manages workflow schedules
   */
  program.addCommand(createScheduleCommand());

  registerSetupCommand(program);
  registerHistoryCommand(program);
  registerCleanCommand(program);

  return program;
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  const program = createProgram();
  program.parse();
}
