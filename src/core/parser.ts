/**
 * Workflow Parser
 *
 * Supports both YAML and JSON format workflow files.
 * Uses polymorphism to handle different file formats.
 * Validates parsed data using Zod schemas for type safety.
 */

import { parse } from 'yaml';
import { ZodError } from 'zod';
import type { Workflow } from '../types/workflow.js';
import { validateWorkflow } from './workflow-schema.js';

/**
 * Parser interface for workflow files
 */
export interface WorkflowParser {
  /**
   * Parse workflow content into Workflow object
   */
  parse(content: string): Workflow;

  /**
   * Extract line numbers for each step (for error reporting)
   * Returns a map: stepIndex -> lineNumber
   */
  extractStepLineNumbers(content: string): Map<number, number>;
}

/**
 * Fix malformed step (YAML indentation issue)
 * When choose/prompt is null but properties exist at step level
 * This happens when YAML is incorrectly indented
 */
function fixMalformedStep(step: unknown): unknown {
  const stepAsRecord = step as Record<string, unknown>;

  // Fix malformed choose structure
  if (
    'choose' in stepAsRecord &&
    (stepAsRecord.choose === null || stepAsRecord.choose === undefined) &&
    'message' in stepAsRecord &&
    'options' in stepAsRecord
  ) {
    return {
      choose: {
        message: stepAsRecord.message as string,
        options: stepAsRecord.options as Array<{ id: string; label: string }>,
        as: stepAsRecord.as as string | undefined,
      },
      when: stepAsRecord.when,
    };
  }

  // Fix malformed prompt structure
  if (
    'prompt' in stepAsRecord &&
    (stepAsRecord.prompt === null || stepAsRecord.prompt === undefined) &&
    'message' in stepAsRecord &&
    'as' in stepAsRecord
  ) {
    return {
      prompt: {
        message: stepAsRecord.message as string,
        as: stepAsRecord.as as string,
        default: stepAsRecord.default as string | undefined,
        validate: stepAsRecord.validate as string | undefined,
      },
      when: stepAsRecord.when,
    };
  }

  // Fix malformed parallel steps
  if ('parallel' in stepAsRecord && Array.isArray(stepAsRecord.parallel)) {
    return {
      ...stepAsRecord,
      parallel: stepAsRecord.parallel.map((subStep: unknown) => fixMalformedStep(subStep)),
    };
  }

  return step;
}

/**
 * YAML Parser
 */
export class YAMLParser implements WorkflowParser {
  parse(content: string): Workflow {
    let parsed: unknown;
    try {
      parsed = parse(content);
    } catch (error) {
      throw new Error(
        `Invalid YAML format: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Fix malformed steps before validation
    if (parsed && typeof parsed === 'object' && 'steps' in parsed) {
      const workflow = parsed as { steps?: unknown[] };
      if (Array.isArray(workflow.steps)) {
        workflow.steps = workflow.steps.map((step) => fixMalformedStep(step));
      }
    }

    // Validate using Zod schema
    try {
      const validated = validateWorkflow(parsed);
      return validated as Workflow;
    } catch (error) {
      if (error instanceof ZodError) {
        // Zod validation error
        const issues = error.issues
          .map((issue) => {
            const path = issue.path.length > 0 ? ` at ${issue.path.join('.')}` : '';
            return `  - ${issue.message}${path}`;
          })
          .join('\n');
        throw new Error(`Invalid workflow structure:\n${issues}`);
      }
      throw error;
    }
  }

  extractStepLineNumbers(content: string): Map<number, number> {
    const lineNumbers = new Map<number, number>();
    const lines = content.split('\n');
    let stepIndex = 0;
    let inSteps = false; // Track if we're inside the "steps:" section

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      // Found the "steps:" section
      if (trimmed === 'steps:' || trimmed.startsWith('steps:')) {
        inSteps = true;
        continue;
      }
      // Found a step (line starting with "-")
      if (inSteps && trimmed.startsWith('-')) {
        lineNumbers.set(stepIndex++, i + 1); // i+1 because line numbers are 1-based
      }
    }

    return lineNumbers;
  }
}

/**
 * JSON Parser
 */
export class JSONParser implements WorkflowParser {
  parse(content: string): Workflow {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Invalid JSON format: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Fix malformed steps before validation
    if (parsed && typeof parsed === 'object' && 'steps' in parsed) {
      const workflow = parsed as { steps?: unknown[] };
      if (Array.isArray(workflow.steps)) {
        workflow.steps = workflow.steps.map((step) => fixMalformedStep(step));
      }
    }

    // Validate using Zod schema
    try {
      const validated = validateWorkflow(parsed);
      return validated as Workflow;
    } catch (error) {
      if (error instanceof ZodError) {
        // Zod validation error
        const issues = error.issues
          .map((issue) => {
            const path = issue.path.length > 0 ? ` at ${issue.path.join('.')}` : '';
            return `  - ${issue.message}${path}`;
          })
          .join('\n');
        throw new Error(`Invalid workflow structure:\n${issues}`);
      }
      throw error;
    }
  }

  extractStepLineNumbers(content: string): Map<number, number> {
    const lineNumbers = new Map<number, number>();
    const lines = content.split('\n');
    let stepIndex = 0;
    let inSteps = false;
    let inStepsArray = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Found "steps" property
      if (trimmed.startsWith('"steps"') || trimmed.startsWith("'steps'")) {
        inSteps = true;
        // Check if it's an array start on the same line
        if (trimmed.includes('[')) {
          inStepsArray = true;
        }
        continue;
      }

      // Found array start after "steps"
      if (inSteps && trimmed === '[') {
        inStepsArray = true;
        continue;
      }

      // Found array end
      if (inStepsArray && trimmed === ']') {
        inStepsArray = false;
        inSteps = false;
        continue;
      }

      // Found a step object (starts with "{" and we're in steps array)
      if (inStepsArray && trimmed.startsWith('{')) {
        lineNumbers.set(stepIndex++, i + 1);
      }
    }

    return lineNumbers;
  }
}

/**
 * Get appropriate parser based on file extension
 */
export function getParser(filePath: string): WorkflowParser {
  const ext = filePath.toLowerCase().split('.').pop();

  switch (ext) {
    case 'yaml':
    case 'yml':
      return new YAMLParser();
    case 'json':
      return new JSONParser();
    default:
      // Default to YAML if extension is not recognized
      // This maintains backward compatibility
      return new YAMLParser();
  }
}
