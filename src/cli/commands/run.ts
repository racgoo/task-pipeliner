import { readFileSync } from 'fs';
import { resolve } from 'path';
import { getParser } from '@core/parsing/parser';
import { uiMessage, uiTone } from '@ui/primitives';
import type { Command } from 'commander';
import { createCliExecutor } from '../core-adapters';
import { extractFileName, selectWorkflowFromTpDirectory } from '../prompts/workflow-select';
import { runCommandAction, throwHandledCliError } from '../shared/command-runtime';
import { parseVarPairs, setSilentMode } from '../shared/utils';

interface RunCommandOptions {
  silent?: boolean;
  profile?: string;
  var?: string[];
}

export function registerRunCommand(program: Command): void {
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
    .action((file: string | undefined, options: RunCommandOptions) =>
      runCommandAction(async () => {
        try {
          // If no file provided, find and select from tp directory
          // Note: File selection prompt should be visible even in silent mode
          const selectedFile: string | null =
            file ?? (await selectWorkflowFromTpDirectory()) ?? null;

          if (!selectedFile) {
            console.error(uiMessage.errorLine('No workflow file found'));
            throwHandledCliError(1);
          }

          // Activate silent mode AFTER file selection (if needed)
          // This ensures the selection prompt is visible
          if (options.silent) {
            setSilentMode();
          }

          // Step 1: Get appropriate parser based on file extension
          const parser = getParser(selectedFile);

          // Step 2: Load and parse workflow file
          console.log(uiTone.info(`Loading workflow from ${selectedFile}...`));
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
          console.log(uiTone.success('Starting workflow execution...\n'));
          const executor = createCliExecutor();
          await executor.execute(workflow, { executionVars });

          // Step 8: Success message
          console.log(uiMessage.successLine('Workflow completed successfully'));
        } catch (error) {
          // Handle errors: show simple message, no stack trace
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(uiMessage.errorLine(`Workflow failed: ${errorMessage}`));
          throwHandledCliError(1);
        }
      })
    );
}
