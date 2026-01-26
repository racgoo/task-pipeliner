/**
 * Zod Schema for Workflow Validation
 *
 * Validates parsed workflow files against the Workflow type definition
 * to ensure type safety at runtime.
 */

import { z } from 'zod';

/**
 * Condition schemas
 */
const FileExistsConditionSchema = z.object({
  file: z.string(),
});

const VarExistsConditionSchema = z.object({
  var: z.union([z.string(), z.record(z.string(), z.string())]).optional(),
  has: z.string().optional(),
});

const StatusConditionSchema = z.object({
  status: z.object({
    fact: z.string(),
    is: z.enum(['ready', 'failed', 'pending']),
  }),
});

const StepConditionSchema = z.object({
  step: z
    .object({
      success: z.boolean(),
    })
    .optional(),
  last_step: z.enum(['success', 'failure']).optional(),
});

const ChoiceConditionSchema = z.object({
  choice: z.string(),
});

// Recursive condition schema
const ConditionPrimitiveSchema = z.union([
  FileExistsConditionSchema,
  ChoiceConditionSchema,
  VarExistsConditionSchema,
  StatusConditionSchema,
  StepConditionSchema,
]);

const ConditionSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([
    ConditionPrimitiveSchema,
    z.object({
      all: z.array(ConditionSchema),
    }),
    z.object({
      any: z.array(ConditionSchema),
    }),
    z.object({
      not: ConditionSchema,
    }),
  ])
);

/**
 * Step schemas
 */
const RunStepSchema = z.object({
  run: z.string(),
  when: ConditionSchema.optional(),
  timeout: z.number().optional(),
  retry: z.number().optional(),
});

const ChooseStepSchema = z.object({
  choose: z.object({
    message: z.string(),
    options: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
      })
    ),
    as: z.string().optional(),
  }),
  when: ConditionSchema.optional(),
});

const PromptStepSchema = z.object({
  prompt: z.object({
    message: z.string(),
    as: z.string(),
    default: z.string().optional(),
    validate: z.string().optional(),
  }),
  when: ConditionSchema.optional(),
});

// Recursive step schema for parallel steps
const StepSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([
    RunStepSchema,
    ChooseStepSchema,
    PromptStepSchema,
    z.object({
      parallel: z.array(StepSchema),
      when: ConditionSchema.optional(),
    }),
    z.object({
      fail: z.object({
        message: z.string(),
      }),
      when: ConditionSchema.optional(),
    }),
  ])
);

/**
 * Workflow schema
 * Note: Internal fields (_lineNumbers, _fileName, _filePath) are not validated
 * as they are added by the parser, not from the source file
 */
export const WorkflowSchema = z.object({
  name: z.string().optional(),
  baseDir: z.string().optional(),
  steps: z.array(StepSchema).min(1, 'Workflow must have at least one step'),
});

/**
 * Validate and parse workflow
 * @throws {z.ZodError} if validation fails
 */
export function validateWorkflow(data: unknown): z.infer<typeof WorkflowSchema> {
  return WorkflowSchema.parse(data);
}

/**
 * Safe validate workflow (returns result instead of throwing)
 */
export function safeValidateWorkflow(data: unknown): {
  success: boolean;
  data?: z.infer<typeof WorkflowSchema>;
  error?: z.ZodError;
} {
  const result = WorkflowSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
