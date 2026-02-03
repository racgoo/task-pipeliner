/**
 * Workflow Parser
 *
 * Supports both YAML and JSON format workflow files.
 * Uses polymorphism to handle different file formats.
 * Validates parsed data using Zod schemas for type safety.
 */

import { parse } from 'yaml';
import { ZodError, ZodIssue } from 'zod';
import type { Workflow } from '../types/workflow';
import { validateWorkflow } from './workflow-schema';

/**
 * Format a Zod validation issue into a user-friendly error message
 */
function formatZodIssue(issue: ZodIssue, parsedData: unknown): string | null {
  const path = issue.path;

  // Custom error messages (from superRefine) - use as-is
  if (issue.code === 'custom') {
    const location = formatPath(path);
    return `  - ${issue.message}${location}`;
  }

  // "Invalid input" from union type mismatch - provide more context
  if (issue.message === 'Invalid input') {
    const location = formatPath(path);
    const context = getStepContext(path, parsedData);
    if (context) {
      return `  - ${context}${location}`;
    }
    return `  - Invalid step type${location}`;
  }

  // Other errors
  const location = formatPath(path);
  return `  - ${issue.message}${location}`;
}

/**
 * Format path array into user-friendly location string
 * e.g., ['steps', 1, 'parallel', 0] -> " at step 2, parallel branch 1"
 */
function formatPath(path: (string | number | symbol)[]): string {
  if (path.length === 0) return '';

  const parts: string[] = [];
  for (let i = 0; i < path.length; i++) {
    const current = path[i];
    const next = path[i + 1];

    if (current === 'steps' && typeof next === 'number') {
      parts.push(`step ${next + 1}`);
      i++; // Skip the number
    } else if (current === 'parallel' && typeof next === 'number') {
      parts.push(`parallel branch ${next + 1}`);
      i++; // Skip the number
    } else if (typeof current === 'string' && current !== 'steps' && current !== 'parallel') {
      parts.push(current);
    }
  }

  return parts.length > 0 ? ` (${parts.join(' → ')})` : '';
}

/**
 * Validation error with friendly message
 */
function validationError(stepIndex: number, message: string, reason?: string): never {
  const reasonLine = reason ? `\n    Reason: ${reason}` : '';
  throw new Error(
    `Invalid workflow structure:\n  - ${message} (step ${stepIndex + 1})${reasonLine}`
  );
}

/**
 * Validate a single step and return errors
 */
function validateStep(
  step: Record<string, unknown>,
  stepIndex: number,
  insideParallel: boolean = false,
  parallelPath: string[] = []
): void {
  const validStepTypes = ['run', 'choose', 'prompt', 'parallel', 'fail'];
  const stepType = validStepTypes.find((type) => type in step);

  // Unknown step type
  if (!stepType) {
    const keys = Object.keys(step).filter((k) => k !== 'when');
    validationError(
      stepIndex,
      `Unknown step type. Found keys: [${keys.join(', ')}]. Valid types: ${validStepTypes.join(', ')}`
    );
  }

  // Run step validations
  if (stepType === 'run') {
    const runValue = step.run;
    if (typeof runValue !== 'string') {
      validationError(stepIndex, "'run' must be a string command");
    }
    if (runValue === '') {
      validationError(stepIndex, "'run' command cannot be empty");
    }

    // Validate shell configuration if provided
    if ('shell' in step && step.shell !== undefined) {
      if (!Array.isArray(step.shell)) {
        validationError(stepIndex, "'shell' must be an array");
      }
      const shellArray = step.shell as unknown[];
      if (shellArray.length === 0) {
        validationError(
          stepIndex,
          "'shell' cannot be empty",
          'Shell configuration must have at least one element (program name)'
        );
      }
      for (let i = 0; i < shellArray.length; i++) {
        if (typeof shellArray[i] !== 'string') {
          validationError(stepIndex, `'shell[${i}]' must be a string`);
        }
      }
    }
  }

  // Choose step validations
  if (stepType === 'choose') {
    if (insideParallel) {
      const pathStr = parallelPath.join(' → ');
      throw new Error(
        `Invalid workflow structure:\n  - 'choose' step is not allowed inside 'parallel' block (step ${stepIndex + 1}, ${pathStr})\n    Reason: User input prompts cannot run in parallel`
      );
    }

    const choose = step.choose;
    if (!choose || typeof choose !== 'object') {
      validationError(stepIndex, "'choose' must be an object with 'message' and 'options'");
    }

    const chooseObj = choose as Record<string, unknown>;
    if (!chooseObj.message || typeof chooseObj.message !== 'string') {
      validationError(stepIndex, "'choose.message' is required and must be a string");
    }
    if (!Array.isArray(chooseObj.options)) {
      validationError(stepIndex, "'choose.options' is required and must be an array");
    }
    if (chooseObj.options.length === 0) {
      validationError(
        stepIndex,
        "'choose.options' cannot be empty",
        'At least one option is required'
      );
    }

    // Validate each option
    for (let i = 0; i < chooseObj.options.length; i++) {
      const opt = chooseObj.options[i] as Record<string, unknown> | null;
      if (!opt || typeof opt !== 'object') {
        validationError(
          stepIndex,
          `'choose.options[${i}]' must be an object with 'id' and 'label'`
        );
      }
      if (!opt.id || typeof opt.id !== 'string') {
        validationError(stepIndex, `'choose.options[${i}].id' is required and must be a string`);
      }
      if (!opt.label || typeof opt.label !== 'string') {
        validationError(stepIndex, `'choose.options[${i}].label' is required and must be a string`);
      }
    }
  }

  // Prompt step validations
  if (stepType === 'prompt') {
    if (insideParallel) {
      const pathStr = parallelPath.join(' → ');
      throw new Error(
        `Invalid workflow structure:\n  - 'prompt' step is not allowed inside 'parallel' block (step ${stepIndex + 1}, ${pathStr})\n    Reason: User input prompts cannot run in parallel`
      );
    }

    const prompt = step.prompt;
    if (!prompt || typeof prompt !== 'object') {
      validationError(stepIndex, "'prompt' must be an object with 'message' and 'as'");
    }

    const promptObj = prompt as Record<string, unknown>;
    if (!promptObj.message || typeof promptObj.message !== 'string') {
      validationError(stepIndex, "'prompt.message' is required and must be a string");
    }
    if (!promptObj.as || typeof promptObj.as !== 'string') {
      validationError(
        stepIndex,
        "'prompt.as' is required and must be a string",
        "The 'as' field specifies the variable name to store the user's input"
      );
    }
  }

  // Parallel step validations
  if (stepType === 'parallel') {
    const parallel = step.parallel;
    if (!Array.isArray(parallel)) {
      validationError(stepIndex, "'parallel' must be an array of steps");
    }
    if (parallel.length === 0) {
      validationError(stepIndex, "'parallel' cannot be empty", 'At least one step is required');
    }

    // Validate nested steps
    for (let i = 0; i < parallel.length; i++) {
      const nestedStep = parallel[i];
      if (!nestedStep || typeof nestedStep !== 'object') {
        validationError(stepIndex, `'parallel[${i}]' must be a valid step object`);
      }
      const nestedPath = [...parallelPath, `branch ${i + 1}`];
      validateStep(nestedStep as Record<string, unknown>, stepIndex, true, nestedPath);
    }
  }

  // Fail step validations
  if (stepType === 'fail') {
    const fail = step.fail;
    if (!fail || typeof fail !== 'object') {
      validationError(stepIndex, "'fail' must be an object with 'message'");
    }

    const failObj = fail as Record<string, unknown>;
    if (!failObj.message || typeof failObj.message !== 'string') {
      validationError(stepIndex, "'fail.message' is required and must be a string");
    }
  }
}

/**
 * Pre-validate workflow for common errors before Zod validation
 * This provides much better error messages for specific cases
 */
function preValidateWorkflow(parsed: unknown): void {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid workflow structure:\n  - Workflow must be an object');
  }

  const workflow = parsed as { steps?: unknown[]; name?: unknown };

  // Check name if provided
  if ('name' in workflow && workflow.name !== undefined && typeof workflow.name !== 'string') {
    throw new Error("Invalid workflow structure:\n  - 'name' must be a string");
  }

  // Check shell if provided
  if ('shell' in workflow && workflow.shell !== undefined) {
    if (!Array.isArray(workflow.shell)) {
      throw new Error("Invalid workflow structure:\n  - 'shell' must be an array");
    }
    if (workflow.shell.length === 0) {
      throw new Error(
        "Invalid workflow structure:\n  - 'shell' cannot be empty\n    Reason: Shell configuration must have at least one element (program name)"
      );
    }
    for (let i = 0; i < workflow.shell.length; i++) {
      if (typeof workflow.shell[i] !== 'string') {
        throw new Error(`Invalid workflow structure:\n  - 'shell[${i}]' must be a string`);
      }
    }
  }

  // Check steps
  if (!('steps' in workflow)) {
    throw new Error("Invalid workflow structure:\n  - 'steps' is required");
  }
  if (!Array.isArray(workflow.steps)) {
    throw new Error("Invalid workflow structure:\n  - 'steps' must be an array");
  }
  if (workflow.steps.length === 0) {
    throw new Error(
      "Invalid workflow structure:\n  - 'steps' cannot be empty\n    Reason: Workflow must have at least one step"
    );
  }

  // Validate each step
  for (let stepIndex = 0; stepIndex < workflow.steps.length; stepIndex++) {
    const step = workflow.steps[stepIndex];
    if (!step || typeof step !== 'object') {
      throw new Error(`Invalid workflow structure:\n  - Step ${stepIndex + 1} must be an object`);
    }
    validateStep(step as Record<string, unknown>, stepIndex);
  }
}

/**
 * Get context about what's wrong with a step
 */
function getStepContext(path: (string | number | symbol)[], parsedData: unknown): string | null {
  try {
    // Navigate to the problematic step
    let current: unknown = parsedData;
    for (const key of path) {
      if (typeof key === 'symbol') continue; // Skip symbol keys
      if (current && typeof current === 'object') {
        current = (current as Record<string | number, unknown>)[key];
      } else {
        return null;
      }
    }

    if (!current || typeof current !== 'object') return null;

    const stepObj = current as Record<string, unknown>;

    // Check what keys exist to give hints
    const keys = Object.keys(stepObj);
    if (keys.length > 0) {
      const validStepTypes = ['run', 'choose', 'prompt', 'parallel', 'fail'];
      const hasValidType = keys.some((k) => validStepTypes.includes(k));
      if (!hasValidType) {
        return `Unknown step type. Found keys: [${keys.join(', ')}]. Valid types: run, choose, prompt, parallel, fail`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

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

    // Pre-validate for common errors with friendly messages
    preValidateWorkflow(parsed);

    // Validate using Zod schema
    try {
      const validated = validateWorkflow(parsed);
      return validated as Workflow;
    } catch (error) {
      if (error instanceof ZodError) {
        // Zod validation error - format with friendly messages
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

    // Pre-validate for common errors with friendly messages
    preValidateWorkflow(parsed);

    // Validate using Zod schema
    try {
      const validated = validateWorkflow(parsed);
      return validated as Workflow;
    } catch (error) {
      if (error instanceof ZodError) {
        // Zod validation error - format with friendly messages
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
