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
import boxen from 'boxen';
import chalk from 'chalk';
import { Command } from 'commander';
import dayjs from 'dayjs';
import { Executor } from '../core/executor';
import { WorkflowHistoryManager } from '../core/history';
import { getParser } from '../core/parser';
import type { History, Record as WorkflowRecord, Step } from '../types/workflow';
import { ChoicePrompt } from './prompts';
import { formatDuration } from './ui';
import { getVersion, setSilentMode } from './utils';

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
      '  3. View execution history:\n' +
      '     tp history           # Interactive menu to view/remove histories\n' +
      '     tp history show      # View a specific history\n' +
      '     tp history remove    # Remove a specific history\n' +
      '     tp history remove-all # Remove all histories\n\n'
  )
  .version(getVersion())
  .addHelpText(
    'after',
    '\nExamples:\n  $ tp run workflow.yaml\n  $ tp run examples/simple-project/workflow.yaml\n  $ tp open docs       # Open documentation\n  $ tp open generator  # Open visual generator\n  $ tp history         # View workflow execution history\n  $ tp history show    # Select and view a specific history\n\nResources:\n  📚 Documentation: https://task-pipeliner.racgoo.com/\n  🎨 Visual Generator: https://task-pipeliner-generator.racgoo.com/\n\nSee README.md for complete DSL reference.'
  );

program
  .command('run')
  .description('Run a workflow from a YAML or JSON file')
  .argument('<file>', 'Path to the workflow file (YAML or JSON, relative or absolute)')
  .option('-s, --silent', 'Run in silent mode (suppress console output)')
  .addHelpText(
    'after',
    '\nExamples:\n  $ tp run workflow.yaml\n  $ tp run workflow.json\n  $ tp run ./my-workflow.yaml\n  $ tp run examples/simple-project/workflow.json\n  $ tp run workflow.yaml --silent\n  $ tp run workflow.yaml -s\n\nWorkflow File Structure:\n  A workflow file must contain a "steps" array with step definitions.\n  Each step can be:\n  • run: Execute a shell command\n  • choose: Prompt user to select from options\n  • prompt: Ask user for text input\n  • parallel: Run multiple steps simultaneously\n  • fail: Stop workflow with error message\n\n  Steps can have "when" conditions to control execution:\n  • file: Check if file/directory exists\n  • var: Check variable value or existence\n  • all/any/not: Combine conditions\n\n  Supported formats: YAML (.yaml, .yml) and JSON (.json)\n  See README.md for complete DSL documentation.'
  )
  .action(async (file: string, options: { silent?: boolean }) => {
    // If silent mode, replace console methods with no-op functions
    if (options.silent) {
      setSilentMode();
    }

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
 * History command group
 * Manages workflow execution history with subcommands or interactive selection
 */
const historyCommand = program.command('history').description('Manage workflow execution history');

/**
 * Main history command action
 * When no subcommand is provided, shows interactive menu to select action
 */
historyCommand.action(async () => {
  const choicePrompt = new ChoicePrompt();
  const choice = await choicePrompt.prompt('Select an action', [
    { id: 'show', label: 'Show - View and select a history to view' },
    { id: 'remove', label: 'Remove - Delete a specific history file' },
    { id: 'remove-all', label: 'Remove All - Delete all history files' },
  ]);

  if (!choice?.id) {
    console.error(chalk.red('\n✗ Invalid choice'));
    process.exit(1);
  }

  // Execute the selected action
  const historyManager = new WorkflowHistoryManager();

  switch (choice.id) {
    case 'show': {
      const historyNames = await historyManager.getHistoryNames();

      if (historyNames.length === 0) {
        console.log(chalk.yellow('\n⚠ No history found'));
        return;
      }

      const selectedChoice = await choicePrompt.prompt(
        'Select a history to view',
        historyNames.map((name) => ({
          id: name,
          label: name,
        }))
      );

      if (!selectedChoice?.id) {
        console.error(chalk.red('\n✗ Invalid choice'));
        process.exit(1);
      }

      try {
        const history = await historyManager.getHistory(selectedChoice.id);
        displayHistory(history, selectedChoice.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(`\n✗ Failed to load history: ${errorMessage}`));
        process.exit(1);
      }
      break;
    }
    case 'remove': {
      const historyNames = await historyManager.getHistoryNames();

      if (historyNames.length === 0) {
        console.log(chalk.yellow('\n⚠ No history found'));
        return;
      }

      const selectedChoice = await choicePrompt.prompt(
        'Select a history to remove',
        historyNames.map((name) => ({
          id: name,
          label: name,
        }))
      );

      if (!selectedChoice?.id) {
        console.error(chalk.red('\n✗ Invalid choice'));
        process.exit(1);
      }

      try {
        await historyManager.removeHistory(selectedChoice.id);
        console.log(chalk.green(`\n✓ Removed history: ${selectedChoice.id}`));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(`\n✗ Failed to remove history: ${errorMessage}`));
        process.exit(1);
      }
      break;
    }
    case 'remove-all': {
      const confirmChoice = await choicePrompt.prompt(
        'Are you sure you want to remove all histories?',
        [
          { id: 'yes', label: 'Yes, remove all' },
          { id: 'no', label: 'No, cancel' },
        ]
      );

      if (confirmChoice?.id !== 'yes') {
        console.log(chalk.yellow('\n✗ Cancelled'));
        return;
      }

      try {
        await historyManager.clearAllHistories();
        console.log(chalk.green('\n✓ All histories removed'));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(`\n✗ Failed to remove histories: ${errorMessage}`));
        process.exit(1);
      }
      break;
    }
    default:
      console.error(chalk.red(`\n✗ Unknown action: ${choice.id}`));
      process.exit(1);
  }
});

/**
 * Extract filename from file path
 */
function extractFileName(filePath: string): string {
  return filePath.split('/').pop() ?? filePath;
}

/**
 * Display workflow execution history in a formatted way
 */
function displayHistory(history: History, filename: string): void {
  console.log('\n');

  // Calculate total duration
  const totalDuration = history.records.reduce((sum, record) => sum + record.duration, 0);
  const successCount = history.records.filter((r) => r.status === 'success').length;
  const failureCount = history.records.filter((r) => r.status === 'failure').length;

  // Format execution summary
  const startTime = dayjs(history.initialTimestamp).format('YYYY-MM-DD HH:mm:ss');
  const durationMs = totalDuration;
  const durationSec = formatDuration(durationMs);

  // Header box
  const headerContent = [
    chalk.bold('Workflow Execution History'),
    '',
    `${chalk.cyan('File:')} ${filename}`,
    `${chalk.cyan('Started:')} ${startTime}`,
    `${chalk.cyan('Total Duration:')} ${durationSec}`,
    `${chalk.cyan('Total Steps:')} ${history.records.length}`,
    `${chalk.green('✓ Successful:')} ${successCount}`,
    failureCount > 0 ? `${chalk.red('✗ Failed:')} ${failureCount}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  console.log(
    boxen(headerContent, {
      borderStyle: 'round',
      padding: { top: 1, bottom: 1, left: 2, right: 2 },
      margin: { top: 0, bottom: 1, left: 0, right: 0 },
      borderColor: 'cyan',
    })
  );

  // Display each step
  history.records.forEach((record, index) => {
    displayRecord(record, index + 1, history.records.length);
  });

  console.log('');
}

/**
 * Display a single execution record
 */
function displayRecord(record: WorkflowRecord, stepNumber: number, totalSteps: number): void {
  const stepType = getStepType(record.step);
  const stepDescription = getStepDescription(record.step);
  const statusIcon = record.status === 'success' ? chalk.green('✓') : chalk.red('✗');
  const statusText = record.status === 'success' ? chalk.green('Success') : chalk.red('Failed');
  const duration = formatDuration(record.duration);

  // Step header
  const stepHeader = [
    `${statusIcon} ${chalk.bold(`Step ${stepNumber}/${totalSteps}`)} - ${chalk.cyan(stepType)}`,
    `${chalk.gray('Duration:')} ${duration} | ${chalk.gray('Status:')} ${statusText}`,
    '',
    chalk.white(stepDescription),
  ].join('\n');

  console.log(
    boxen(stepHeader, {
      borderStyle: 'round',
      padding: { top: 1, bottom: 1, left: 2, right: 2 },
      margin: { top: 0, bottom: 1, left: 0, right: 0 },
      borderColor: record.status === 'success' ? 'green' : 'red',
    })
  );

  // Display output if available
  if (isTaskRunResult(record.output)) {
    displayTaskOutput(record.output);
  }
}

/**
 * Get step type name
 */
function getStepType(step: Step): string {
  if ('run' in step) return 'Run';
  if ('choose' in step) return 'Choose';
  if ('prompt' in step) return 'Prompt';
  if ('parallel' in step) return 'Parallel';
  if ('fail' in step) return 'Fail';
  return 'Unknown';
}

/**
 * Get step description
 */
function getStepDescription(step: Step): string {
  if ('run' in step) {
    return `Command: ${chalk.yellow(step.run)}`;
  }
  if ('choose' in step) {
    return `Message: ${chalk.yellow(step.choose.message)}`;
  }
  if ('prompt' in step) {
    return `Message: ${chalk.yellow(step.prompt.message)} | Variable: ${chalk.cyan(step.prompt.as)}`;
  }
  if ('parallel' in step) {
    return `Parallel execution with ${step.parallel.length} branches`;
  }
  if ('fail' in step) {
    return `Error: ${chalk.red(step.fail.message)}`;
  }
  return 'Unknown step type';
}

/**
 * Check if output is TaskRunResult
 */
function isTaskRunResult(
  output: unknown
): output is { success: boolean; stdout: string[]; stderr: string[] } {
  return (
    typeof output === 'object' &&
    output !== null &&
    'success' in output &&
    'stdout' in output &&
    'stderr' in output
  );
}

/**
 * Display task output (stdout/stderr)
 */
function displayTaskOutput(output: { success: boolean; stdout: string[]; stderr: string[] }): void {
  if (output.stdout.length > 0) {
    const stdoutContent = output.stdout.map((line) => chalk.gray(`  ${line}`)).join('\n');
    console.log(chalk.green('  Output:'));
    console.log(stdoutContent);
  }

  if (output.stderr.length > 0) {
    const stderrContent = output.stderr.map((line) => chalk.gray(`  ${line}`)).join('\n');
    console.log(chalk.red('  Errors:'));
    console.log(stderrContent);
  }
}

program.parse();
