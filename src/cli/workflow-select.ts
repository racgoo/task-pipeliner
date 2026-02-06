/**
 * Workflow file selection (e.g. from tp/workflows when no file argument given)
 */

import { existsSync, readFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, extname } from 'path';
import chalk from 'chalk';
import { getParser } from '../core/parser';
import { ChoicePrompt } from './prompts';
import { findNearestTpDirectory } from './utils';

/**
 * Let user pick a workflow file from the nearest tp/workflows directory.
 * Returns the selected file path or null if none/cancelled.
 */
export async function selectWorkflowFromTpDirectory(): Promise<string | null> {
  const tpDir = findNearestTpDirectory();
  if (!tpDir) {
    console.error(chalk.red('\n✗ No tp directory found'));
    return null;
  }

  const workflowsDir = join(tpDir, 'workflows');
  if (!existsSync(workflowsDir)) {
    console.error(chalk.red(`\n✗ No workflows directory found at ${workflowsDir}`));
    return null;
  }

  try {
    const files = await readdir(workflowsDir);
    const workflowFiles = files.filter((file) => {
      const ext = extname(file).toLowerCase();
      return ['.yaml', '.yml', '.json'].includes(ext);
    });

    if (workflowFiles.length === 0) {
      console.error(chalk.red('\n✗ No workflow files found in tp/workflows'));
      return null;
    }

    const choices = await Promise.all(
      workflowFiles.map(async (file) => {
        const filePath = join(workflowsDir, file);
        try {
          const parser = getParser(filePath);
          const content = readFileSync(filePath, 'utf-8');
          const workflow = parser.parse(content);
          const workflowName = workflow.name ?? 'Untitled';
          return { id: filePath, label: `${file} - ${workflowName}` };
        } catch {
          return { id: filePath, label: file };
        }
      })
    );

    const choicePrompt = new ChoicePrompt(true);
    const selected = await choicePrompt.prompt('Select a workflow to run', choices);
    return selected?.id ?? null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`\n✗ Failed to read tp directory: ${errorMessage}`));
    return null;
  }
}

/**
 * Return the last path segment (filename) from a file path
 */
export function extractFileName(filePath: string): string {
  return filePath.split('/').pop() ?? filePath;
}
