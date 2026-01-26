#!/usr/bin/env node

/**
 * CLI Entry Point
 *
 * This is the main command-line interface for task-pipeliner.
 *
 * Usage:
 *   task-pipeliner run workflow.yaml
 *   task-pipeliner run workflow.json
 *
 * What it does:
 * 1. Reads workflow file (YAML or JSON)
 * 2. Parses workflow definition
 * 3. Extracts step line numbers (for error reporting)
 * 4. Executes workflow using Executor
 * 5. Handles errors and displays results
 */

import { exec } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { promisify } from 'util';
import chalk from 'chalk';
import { Command } from 'commander';
import { Executor } from '../core/executor.js';
import { getParser } from '../core/parser.js';

const execAsync = promisify(exec);

const program = new Command();

program
  .name('task-pipeliner')
  .description(
    'A powerful task pipeline runner with condition-based workflow execution.\n\n' +
      'Define workflows in YAML or JSON files with conditional execution, parallel tasks,\n' +
      'interactive prompts, and variable substitution.\n\n' +
      'Features:\n' +
      '  • Condition-based execution (file checks, variable comparisons)\n' +
      '  • Parallel task execution\n' +
      '  • Interactive prompts and choices\n' +
      '  • Variable substitution with {{variables}}\n' +
      '  • Beautiful terminal output\n' +
      '  • Supports both YAML (.yaml, .yml) and JSON (.json) formats\n\n' +
      'Quick Start:\n' +
      '  1. Create a workflow.yaml or workflow.json file:\n' +
      '     steps:\n' +
      '       - run: echo "Hello, World!"\n' +
      '       - choose:\n' +
      '           message: "Select action:"\n' +
      '           options:\n' +
      '             - id: build\n' +
      '               label: "Build"\n' +
      '           as: action\n' +
      '       - when:\n' +
      '           var:\n' +
      '             action: build\n' +
      '         run: npm run build\n\n' +
      '  2. Run it:\n' +
      '     tp run workflow.yaml\n' +
      '     tp run workflow.json\n\n' +
      'Resources:\n' +
      '  📚 Documentation: https://task-pipeliner.racgoo.com/\n' +
      '  🎨 Visual Generator: https://task-pipeliner-generator.racgoo.com/\n' +
      '  💻 Quick access: tp open docs | tp open generator'
  )
  .version('0.1.0')
  .addHelpText(
    'after',
    '\nExamples:\n  $ tp run workflow.yaml\n  $ tp run examples/simple-project/workflow.yaml\n  $ tp open docs       # Open documentation\n  $ tp open generator  # Open visual generator\n\nResources:\n  📚 Documentation: https://task-pipeliner.racgoo.com/\n  🎨 Visual Generator: https://task-pipeliner-generator.racgoo.com/\n\nSee README.md for complete DSL reference.'
  );

program
  .command('run')
  .description('Run a workflow from a YAML or JSON file')
  .argument('<file>', 'Path to the workflow file (YAML or JSON, relative or absolute)')
  .addHelpText(
    'after',
    '\nExamples:\n  $ tp run workflow.yaml\n  $ tp run workflow.json\n  $ tp run ./my-workflow.yaml\n  $ tp run examples/simple-project/workflow.json\n\nWorkflow File Structure:\n  A workflow file must contain a "steps" array with step definitions.\n  Each step can be:\n  • run: Execute a shell command\n  • choose: Prompt user to select from options\n  • prompt: Ask user for text input\n  • parallel: Run multiple steps simultaneously\n  • fail: Stop workflow with error message\n\n  Steps can have "when" conditions to control execution:\n  • file: Check if file/directory exists\n  • var: Check variable value or existence\n  • all/any/not: Combine conditions\n\n  Supported formats: YAML (.yaml, .yml) and JSON (.json)\n  See README.md for complete DSL documentation.'
  )
  .action(async (file: string) => {
    try {
      // Step 1: Get appropriate parser based on file extension
      const parser = getParser(file);

      // Step 2: Load and parse workflow file
      console.log(chalk.blue(`Loading workflow from ${file}...`));
      const content = readFileSync(file, 'utf-8');
      const workflow = parser.parse(content);

      // Step 3: Validate workflow structure
      if (!workflow.steps || !Array.isArray(workflow.steps)) {
        throw new Error('Invalid workflow: steps array is required');
      }

      // Step 4: Extract metadata for error reporting
      workflow._lineNumbers = parser.extractStepLineNumbers(content); // Map step index -> line number
      workflow._fileName = extractFileName(file); // Just the filename, not full path

      // Step 5: Store absolute file path (needed for resolving relative baseDir)
      workflow._filePath = resolve(file);

      // Step 6: Execute workflow
      console.log(chalk.green('Starting workflow execution...\n'));
      const executor = new Executor();
      await executor.execute(workflow);

      // Step 7: Success message
      console.log(chalk.green('\n✓ Workflow completed successfully'));
    } catch (error) {
      // Handle errors: show simple message, no stack trace
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`\n✗ Workflow failed: ${errorMessage}`));
      process.exit(1);
    }
  });

program
  .command('open')
  .description('Open generator or docs website in browser')
  .argument('<target>', 'Target to open: "generator" or "docs"')
  .addHelpText(
    'after',
    '\nExamples:\n  $ tp open generator\n  $ tp open docs\n\nTargets:\n  generator  Open the visual workflow generator (https://task-pipeliner-generator.racgoo.com/)\n  docs       Open the documentation site (https://task-pipeliner.racgoo.com/)'
  )
  .action(async (target: string) => {
    const urls: Record<string, string> = {
      generator: 'https://task-pipeliner-generator.racgoo.com/',
      docs: 'https://task-pipeliner.racgoo.com/',
    };

    const url = urls[target.toLowerCase()];
    if (!url) {
      console.error(chalk.red(`\n✗ Invalid target: ${target}`));
      console.log(chalk.yellow('\nValid targets:'));
      console.log(chalk.yellow('  • generator - Open the visual workflow generator'));
      console.log(chalk.yellow('  • docs      - Open the documentation site'));
      process.exit(1);
    }

    try {
      const platform = process.platform;
      let command: string;

      if (platform === 'darwin') {
        command = `open "${url}"`;
      } else if (platform === 'win32') {
        command = `start "${url}"`;
      } else {
        command = `xdg-open "${url}"`;
      }

      await execAsync(command);
      console.log(
        chalk.green(
          `\n✓ Opening ${target === 'generator' ? 'generator' : 'documentation'} in browser...`
        )
      );
      console.log(chalk.blue(`   ${url}`));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`\n✗ Failed to open browser: ${errorMessage}`));
      console.log(chalk.yellow(`\nPlease visit manually: ${url}`));
      process.exit(1);
    }
  });

/**
 * Extract filename from file path
 */
function extractFileName(filePath: string): string {
  return filePath.split('/').pop() || filePath;
}

program.parse();
