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
import { existsSync, readFileSync } from 'fs';
import { mkdir, rm, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { resolve, join } from 'path';
import { promisify } from 'util';
import chalk from 'chalk';
import { Command } from 'commander';
import { getDaemonStatus, isDaemonRunning } from '../core/daemon-manager';
import { Executor } from '../core/executor';
import { WorkflowHistoryManager } from '../core/history';
import { getParser } from '../core/parser';
import { WorkflowScheduler } from '../core/scheduler';
import { displayHistory } from './history-display';
import { ChoicePrompt } from './prompts';
import { createScheduleCommand } from './schedule';
import { SETUP_WORKFLOW_EXAMPLES, SETUP_SCHEDULE_EXAMPLES } from './setup-examples';
import { getVersion, parseVarPairs, setSilentMode } from './utils';
import { extractFileName, selectWorkflowFromTpDirectory } from './workflow-select';

const PIPELINER_ROOT = join(homedir(), '.pipeliner');

const execAsync = promisify(exec);

const program = new Command();

program
  .name('task-pipeliner')
  .description(
    'A powerful task pipeline runner with condition-based workflow execution.\n\n' +
      'Define workflows in YAML or JSON files with conditional execution, parallel tasks,\n' +
      'interactive prompts, variable substitution, and cron-based scheduling.\n\n' +
      'Features:\n' +
      '  • Condition-based execution (file checks, variable comparisons)\n' +
      '  • Parallel task execution\n' +
      '  • Interactive prompts and choices\n' +
      '  • Variable substitution with {{variables}}\n' +
      '  • Profiles: run the same workflow with different variable sets (--profile)\n' +
      '  • Override or inject variables: -v key=value (repeatable, applied after --profile)\n' +
      '  • Schedule: run workflows on a cron schedule (tp schedule add/list/start/status)\n' +
      '  • Beautiful terminal output\n' +
      '  • Supports both YAML (.yaml, .yml) and JSON (.json) formats\n\n' +
      'Quick Start:\n' +
      '  0. (Optional) tp setup — create tp/, tp/workflows, tp/schedules and add 2 example workflows + 2 example schedules (echo-based dummies)\n\n' +
      '  1. Create a workflow.yaml or workflow.json file:\n' +
      '     steps:\n' +
      '       - run: \'echo "Hello, World!"\'\n' +
      '       - choose:\n' +
      '           message: "Select action:"\n' +
      '           options:\n' +
      '             - id: build\n' +
      '               label: "Build"\n' +
      '           as: action\n' +
      '       - when:\n' +
      '           var:\n' +
      '             action: build\n' +
      "         run: 'npm run build'\n\n" +
      '  2. Run it:\n' +
      '     tp run workflow.yaml\n' +
      '     tp run workflow.json\n\n' +
      '  3. View execution history:\n' +
      '     tp history           # Interactive menu to view/remove histories\n' +
      '     tp history show      # View a specific history\n' +
      '     tp history remove    # Remove a specific history\n' +
      '     tp history remove-all # Remove all histories\n\n' +
      '  4. Schedule workflows (cron):\n' +
      '     tp schedule add schedule.yaml   # Add schedules from a file (or tp/schedules/*.yaml after tp setup)\n' +
      '     tp schedule list                # List schedules\n' +
      '     tp schedule start -d            # Start daemon in background\n' +
      '     tp schedule status              # View daemon and schedule status\n\n' +
      '  5. Other commands:\n' +
      '     tp setup           # Create tp/workflows, tp/schedules with example files\n' +
      '     tp open docs       # Open documentation in browser\n' +
      '     tp open generator  # Open visual workflow generator\n' +
      '     tp clean           # Remove ~/.pipeliner data (schedules, daemon, history)\n\n' +
      '  Note: After upgrading to a new version, if you see compatibility issues (e.g. schedules or daemon), run "tp clean" to reset ~/.pipeliner data.\n\n'
  )
  .version(getVersion())
  .addHelpText(
    'after',
    '\nExamples:\n' +
      '  $ tp setup\n' +
      '  $ tp run workflow.yaml\n' +
      '  $ tp run workflow.yaml --profile Production\n' +
      '  $ tp run workflow.yaml -v version=1.0.0\n' +
      '  $ tp run workflow.yaml --profile Prod -v version=2.0.0\n' +
      '  $ tp schedule add schedule.yaml\n' +
      '  $ tp schedule list\n' +
      '  $ tp schedule start -d\n' +
      '  $ tp schedule status\n' +
      '  $ tp open docs\n' +
      '  $ tp open generator\n' +
      '  $ tp history\n' +
      '  $ tp history show\n' +
      '  $ tp clean\n\n' +
      'After upgrading: if schedules or daemon misbehave, run "tp clean" to reset ~/.pipeliner.\n\n' +
      'Resources:\n' +
      '  📚 Documentation: https://task-pipeliner.racgoo.com/\n' +
      '  🎨 Visual Generator: https://task-pipeliner-generator.racgoo.com/\n\n' +
      'See README.md for complete DSL reference.'
  );

program
  .command('run')
  .description('Run a workflow from a YAML or JSON file')
  .argument(
    '[file]',
    'Path to the workflow file (YAML or JSON, relative or absolute). If omitted, will select from workflows in the nearest tp/workflows directory.'
  )
  .option('-s, --silent', 'Run in silent mode (suppress console output)')
  .option('-p, --profile <name>', 'Run in profile mode (use profile name)')
  .option(
    '-v, --var <pair>',
    'Set variable (key=value). Overrides profile. Can repeat.',
    (value: string, previous: string[] | undefined) => {
      const acc = previous ?? [];
      acc.push(value);
      return acc;
    },
    [] as string[]
  )
  .addHelpText(
    'after',
    '\nExamples:\n  $ tp run workflow.yaml\n  $ tp run workflow.json\n  $ tp run ./my-workflow.yaml\n  $ tp run examples/simple-project/workflow.json\n  $ tp run                    # Select from workflows in nearest tp/workflows\n  $ tp run workflow.yaml --silent\n  $ tp run workflow.yaml -s\n  $ tp run workflow.yaml -v version=1.0.0\n  $ tp run workflow.yaml --profile Prod -v version=2.0.0\n\nWorkflow File Structure:\n  A workflow file must contain a "steps" array with step definitions.\n  Each step can be:\n  • run: Execute a shell command\n  • choose: Prompt user to select from options\n  • prompt: Ask user for text input\n  • parallel: Run multiple steps simultaneously\n  • fail: Stop workflow with error message\n\n  Steps can have "when" conditions to control execution:\n  • file: Check if file/directory exists\n  • var: Check variable value or existence\n  • all/any/not: Combine conditions\n\n  Supported formats: YAML (.yaml, .yml) and JSON (.json)\n  See README.md for complete DSL documentation.'
  )
  .action(
    async (
      file: string | undefined,
      options: { silent?: boolean; profile?: string; var?: string[] }
    ) => {
      try {
        // If no file provided, find and select from tp directory
        // Note: File selection prompt should be visible even in silent mode
        const selectedFile: string | null = file ?? (await selectWorkflowFromTpDirectory()) ?? null;

        if (!selectedFile) {
          console.error(chalk.red('\n✗ No workflow file found'));
          process.exit(1);
        }

        // Activate silent mode AFTER file selection (if needed)
        // This ensures the selection prompt is visible
        if (options.silent) {
          setSilentMode();
        }

        // Step 1: Get appropriate parser based on file extension
        const parser = getParser(selectedFile);

        // Step 2: Load and parse workflow file
        console.log(chalk.blue(`Loading workflow from ${selectedFile}...`));
        const content = readFileSync(selectedFile, 'utf-8');
        const workflow = parser.parse(content);

        // Step 3: Validate workflow structure
        if (!workflow.steps || !Array.isArray(workflow.steps)) {
          throw new Error('Invalid workflow: steps array is required');
        }

        // Step 4: Profile (if any), then -v/--var (overwrites/adds). Merge and pass to executor.
        let profileVars: Record<string, string> = {};
        if (options.profile) {
          const profileName = options.profile.trim();
          if (!workflow.profiles?.length) {
            throw new Error(
              `Profile "${profileName}" requested but workflow has no "profiles" defined. Add a "profiles" section to your workflow file.`
            );
          }
          const profile = workflow.profiles.find((p) => p.name === profileName);
          if (!profile) {
            const available = workflow.profiles.map((p) => p.name).join(', ');
            throw new Error(
              `Profile "${profileName}" not found. Available profile(s): ${available}`
            );
          }
          profileVars = { ...profile.var };
        }

        const varPairs = options.var ?? [];
        const cliVars = varPairs.length > 0 ? parseVarPairs(varPairs) : {};

        const mergedVars = { ...profileVars, ...cliVars };
        const executionVars = Object.keys(mergedVars).length > 0 ? mergedVars : undefined;

        // Step 5: Extract metadata for error reporting
        workflow._lineNumbers = parser.extractStepLineNumbers(content); // Map step index -> line number
        workflow._fileName = extractFileName(selectedFile); // Just the filename, not full path

        // Step 6: Store absolute file path (needed for resolving relative baseDir)
        workflow._filePath = resolve(selectedFile);

        // Step 7: Execute workflow
        console.log(chalk.green('Starting workflow execution...\n'));
        const executor = new Executor();
        await executor.execute(workflow, { executionVars });

        // Step 8: Success message
        console.log(chalk.green('\n✓ Workflow completed successfully'));
      } catch (error) {
        // Handle errors: show simple message, no stack trace
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(`\n✗ Workflow failed: ${errorMessage}`));
        process.exit(1);
      }
    }
  );

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
 * Schedule command group
 * Manages workflow schedules
 */
program.addCommand(createScheduleCommand());

/**
 * Setup command - Create tp directory with workflows and schedules and example files
 */
program
  .command('setup')
  .description(
    'Create tp directory with workflows and schedules folders and add 2 example files in each (echo-based dummies). Run from project root for easy initial setup.'
  )
  .action(async () => {
    const cwd = process.cwd();
    const tpDir = join(cwd, 'tp');
    const workflowsDir = join(tpDir, 'workflows');
    const schedulesDir = join(tpDir, 'schedules');

    if (existsSync(tpDir)) {
      console.log(chalk.gray(`\n  tp directory already exists at ${tpDir}`));
    } else {
      await mkdir(tpDir, { recursive: true });
      console.log(chalk.green(`\n✓ Created ${tpDir}`));
    }

    const ensureDir = async (dir: string, label: string) => {
      if (existsSync(dir)) {
        console.log(chalk.gray(`  ${label} already exists`));
      } else {
        await mkdir(dir, { recursive: true });
        console.log(chalk.green(`✓ Created ${label}`));
      }
    };

    await ensureDir(workflowsDir, 'tp/workflows');
    await ensureDir(schedulesDir, 'tp/schedules');

    const created: string[] = [];

    for (const { filename, content } of SETUP_WORKFLOW_EXAMPLES) {
      const filePath = join(workflowsDir, filename);
      if (existsSync(filePath)) {
        console.log(chalk.gray(`  Skipped (exists): tp/workflows/${filename}`));
      } else {
        await writeFile(filePath, content, 'utf-8');
        created.push(`tp/workflows/${filename}`);
      }
    }

    for (const { filename, content } of SETUP_SCHEDULE_EXAMPLES) {
      const filePath = join(schedulesDir, filename);
      if (existsSync(filePath)) {
        console.log(chalk.gray(`  Skipped (exists): tp/schedules/${filename}`));
      } else {
        await writeFile(filePath, content, 'utf-8');
        created.push(`tp/schedules/${filename}`);
      }
    }

    if (created.length > 0) {
      console.log(chalk.green(`\n✓ Added ${created.length} example file(s):`));
      created.forEach((p) => console.log(chalk.dim(`   ${p}`)));
    }

    console.log(
      chalk.dim(
        '\n  Next: tp run tp/workflows/example-hello.yaml  |  tp schedule add tp/schedules/example-daily.yaml  |  tp schedule list'
      )
    );
    console.log();
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
  const searchableChoicePrompt = new ChoicePrompt(true);
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

      const selectedChoice = await searchableChoicePrompt.prompt(
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

      const selectedChoice = await searchableChoicePrompt.prompt(
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
 * Clean command - Remove ~/.pipeliner data (schedules, daemon state, workflow history)
 * Useful after upgrades when data may be incompatible.
 */
program
  .command('clean')
  .description(
    'Remove all data in ~/.pipeliner (schedules, daemon state, workflow history). Use after upgrades if data is incompatible.'
  )
  .action(async () => {
    const choicePrompt = new ChoicePrompt();
    const confirmChoice = await choicePrompt.prompt(
      `This will remove all data in ${chalk.yellow(PIPELINER_ROOT)} (schedules, daemon PID, workflow history). Continue?`,
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
      if (await isDaemonRunning()) {
        const status = await getDaemonStatus();
        console.log(chalk.gray(`Stopping scheduler daemon (PID: ${status.pid})...`));
        const scheduler = new WorkflowScheduler();
        await scheduler.stopDaemon();
        console.log(chalk.gray('  Daemon stopped'));
      }

      if (existsSync(PIPELINER_ROOT)) {
        await rm(PIPELINER_ROOT, { recursive: true });
        console.log(chalk.green(`\n✓ Removed ${PIPELINER_ROOT}`));
      } else {
        console.log(chalk.gray(`\n  ${PIPELINER_ROOT} does not exist (already clean)`));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`\n✗ Clean failed: ${errorMessage}`));
      process.exit(1);
    }
  });

program.parse();
