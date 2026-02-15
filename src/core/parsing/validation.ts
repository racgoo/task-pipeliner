import type { ZodIssue } from 'zod';

/**
 * Format path array into user-friendly location string
 * e.g., ['steps', 1, 'parallel', 0] -> " (step 2 → parallel branch 1)"
 */
function formatPath(path: (string | number | symbol)[]): string {
  if (path.length === 0) return '';

  const parts: string[] = [];
  for (let i = 0; i < path.length; i++) {
    const current = path[i];
    const next = path[i + 1];

    if (current === 'steps' && typeof next === 'number') {
      parts.push(`step ${next + 1}`);
      i++;
    } else if (current === 'parallel' && typeof next === 'number') {
      parts.push(`parallel branch ${next + 1}`);
      i++;
    } else if (typeof current === 'string' && current !== 'steps' && current !== 'parallel') {
      parts.push(current);
    }
  }

  return parts.length > 0 ? ` (${parts.join(' → ')})` : '';
}

function validationError(stepIndex: number, message: string, reason?: string): never {
  const reasonLine = reason ? `\n    Reason: ${reason}` : '';
  throw new Error(
    `Invalid workflow structure:\n  - ${message} (step ${stepIndex + 1})${reasonLine}`
  );
}

function validateStep(
  step: Record<string, unknown>,
  stepIndex: number,
  insideParallel: boolean = false,
  parallelPath: string[] = []
): void {
  const validStepTypes = ['run', 'choose', 'prompt', 'parallel', 'fail'];
  const stepType = validStepTypes.find((type) => type in step);

  if (!stepType) {
    const keys = Object.keys(step).filter((k) => k !== 'when');
    validationError(
      stepIndex,
      `Unknown step type. Found keys: [${keys.join(', ')}]. Valid types: ${validStepTypes.join(', ')}`
    );
  }

  if (stepType === 'run') {
    const runValue = step.run;
    if (typeof runValue !== 'string') validationError(stepIndex, "'run' must be a string command");
    if (runValue === '') validationError(stepIndex, "'run' command cannot be empty");

    if ('shell' in step && step.shell !== undefined) {
      if (!Array.isArray(step.shell)) validationError(stepIndex, "'shell' must be an array");
      const shellArray = step.shell as unknown[];
      if (shellArray.length === 0) {
        validationError(
          stepIndex,
          "'shell' cannot be empty",
          'Shell configuration must have at least one element (program name)'
        );
      }
      for (let i = 0; i < shellArray.length; i++) {
        if (typeof shellArray[i] !== 'string')
          validationError(stepIndex, `'shell[${i}]' must be a string`);
      }
    }
  }

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

  if (stepType === 'parallel') {
    const parallel = step.parallel;
    if (!Array.isArray(parallel))
      validationError(stepIndex, "'parallel' must be an array of steps");
    if (parallel.length === 0)
      validationError(stepIndex, "'parallel' cannot be empty", 'At least one step is required');

    for (let i = 0; i < parallel.length; i++) {
      const nestedStep = parallel[i];
      if (!nestedStep || typeof nestedStep !== 'object') {
        validationError(stepIndex, `'parallel[${i}]' must be a valid step object`);
      }
      const nestedPath = [...parallelPath, `branch ${i + 1}`];
      validateStep(nestedStep as Record<string, unknown>, stepIndex, true, nestedPath);
    }
  }

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

export function preValidateWorkflow(parsed: unknown): void {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid workflow structure:\n  - Workflow must be an object');
  }

  const workflow = parsed as { steps?: unknown[]; name?: unknown; shell?: unknown };

  if ('name' in workflow && workflow.name !== undefined && typeof workflow.name !== 'string') {
    throw new Error("Invalid workflow structure:\n  - 'name' must be a string");
  }

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

  if (!('steps' in workflow))
    throw new Error("Invalid workflow structure:\n  - 'steps' is required");
  if (!Array.isArray(workflow.steps))
    throw new Error("Invalid workflow structure:\n  - 'steps' must be an array");
  if (workflow.steps.length === 0) {
    throw new Error(
      "Invalid workflow structure:\n  - 'steps' cannot be empty\n    Reason: Workflow must have at least one step"
    );
  }

  for (let stepIndex = 0; stepIndex < workflow.steps.length; stepIndex++) {
    const step = workflow.steps[stepIndex];
    if (!step || typeof step !== 'object') {
      throw new Error(`Invalid workflow structure:\n  - Step ${stepIndex + 1} must be an object`);
    }
    validateStep(step as Record<string, unknown>, stepIndex);
  }
}

function getStepContext(path: (string | number | symbol)[], parsedData: unknown): string | null {
  try {
    let current: unknown = parsedData;
    for (const key of path) {
      if (typeof key === 'symbol') continue;
      if (current && typeof current === 'object') {
        current = (current as Record<string | number, unknown>)[key];
      } else {
        return null;
      }
    }

    if (!current || typeof current !== 'object') return null;

    const stepObj = current as Record<string, unknown>;
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

export function formatZodIssue(issue: ZodIssue, parsedData: unknown): string | null {
  const path = issue.path;

  if (issue.code === 'custom') {
    const location = formatPath(path);
    return `  - ${issue.message}${location}`;
  }

  if (issue.message === 'Invalid input') {
    const location = formatPath(path);
    const context = getStepContext(path, parsedData);
    if (context) {
      return `  - ${context}${location}`;
    }
    return `  - Invalid step type${location}`;
  }

  const location = formatPath(path);
  return `  - ${issue.message}${location}`;
}
