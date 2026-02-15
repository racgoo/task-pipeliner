/**
 * Schedule file parser for YAML and JSON formats
 */

import { readFile } from 'fs/promises';
import { extname } from 'path';
import { ScheduleFile } from '@tp-types/schedule-file';
import { parse as parseYAML } from 'yaml';
import { ZodError } from 'zod';
import { validateScheduleFile } from './schedule-file-schema';

/**
 * Parse schedule file (YAML or JSON)
 */
export async function parseScheduleFile(filePath: string): Promise<ScheduleFile> {
  const content = await readFile(filePath, 'utf-8');
  const ext = extname(filePath).toLowerCase();

  let parsed: unknown;

  try {
    if (ext === '.yaml' || ext === '.yml') {
      parsed = parseYAML(content);
    } else if (ext === '.json') {
      parsed = JSON.parse(content);
    } else {
      throw new Error(`Unsupported file format: ${ext}. Use .yaml, .yml, or .json`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unsupported')) {
      throw error;
    }
    const format = ext === '.json' ? 'JSON' : 'YAML';
    throw new Error(
      `Invalid ${format} format: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Validate with Zod
  try {
    const validated = validateScheduleFile(parsed);
    return validated as ScheduleFile;
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues.map((e) => `  - ${e.message} (${e.path.join('.')})`).join('\n');
      throw new Error(`Invalid schedule file structure:\n${issues}`);
    }
    throw error;
  }
}
