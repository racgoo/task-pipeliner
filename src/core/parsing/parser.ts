/**
 * Workflow Parser
 *
 * Supports both YAML and JSON format workflow files.
 * Uses polymorphism to handle different file formats.
 * Validates parsed data using Zod schemas for type safety.
 */

import type { Workflow } from '@tp-types/workflow';
import { parse } from 'yaml';
import { ZodError } from 'zod';
import { validateWorkflow } from '../workflow/schema';
import { fixMalformedStep } from './malformed-step';
import { formatZodIssue, preValidateWorkflow } from './validation';

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

    // Pre-validate for common errors with friendly messages
    preValidateWorkflow(parsed);

    // Validate using Zod schema
    try {
      const validated = validateWorkflow(parsed);
      return validated as Workflow;
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues
          .map((issue) => formatZodIssue(issue, parsed))
          .filter((msg) => msg !== null)
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

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed === 'steps:' || trimmed.startsWith('steps:')) {
        inSteps = true;
        continue;
      }
      if (inSteps && trimmed.startsWith('-')) {
        lineNumbers.set(stepIndex++, i + 1);
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

    // Pre-validate for common errors with friendly messages
    preValidateWorkflow(parsed);

    // Validate using Zod schema
    try {
      const validated = validateWorkflow(parsed);
      return validated as Workflow;
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues
          .map((issue) => formatZodIssue(issue, parsed))
          .filter((msg) => msg !== null)
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

      if (trimmed.startsWith('"steps"') || trimmed.startsWith("'steps'")) {
        inSteps = true;
        if (trimmed.includes('[')) {
          inStepsArray = true;
        }
        continue;
      }

      if (inSteps && trimmed === '[') {
        inStepsArray = true;
        continue;
      }

      if (inStepsArray && trimmed === ']') {
        inStepsArray = false;
        inSteps = false;
        continue;
      }

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
