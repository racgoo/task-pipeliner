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
const RunStepOnErrorSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    run: z.string(),
    timeout: z.number().optional(),
    retry: z.union([z.number(), z.literal('Infinity')]).optional(),
    onError: RunStepOnErrorSchema.optional(),
  })
);

// Capture schemas
const FullCaptureSchema = z.object({
  as: z.string(),
});

const RegexCaptureSchema = z.object({
  regex: z.string(),
  as: z.string(),
});

const JsonCaptureSchema = z.object({
  json: z.string(),
  as: z.string(),
});

const YamlCaptureSchema = z.object({
  yaml: z.string(),
  as: z.string(),
});

const YmlCaptureSchema = z.object({
  yml: z.string(),
  as: z.string(),
});

const KvCaptureSchema = z.object({
  kv: z.string(),
  as: z.string(),
});

const AfterCaptureSchema = z.object({
  after: z.string(),
  as: z.string(),
});

const BeforeCaptureSchema = z.object({
  before: z.string(),
  as: z.string(),
});

const BetweenCaptureSchema = z.object({
  after: z.string(),
  before: z.string(),
  as: z.string(),
});

const LineCaptureSchema = z.object({
  line: z.object({
    from: z.number(),
    to: z.number(),
  }),
  as: z.string(),
});

// CaptureSchema union: FullCaptureSchema must be last because it only has 'as',
// while all other schemas have specific fields that distinguish them.
// Zod union matches in order, so more specific schemas must come first.
const CaptureSchema = z.union([
  RegexCaptureSchema,
  JsonCaptureSchema,
  YamlCaptureSchema,
  YmlCaptureSchema,
  KvCaptureSchema,
  BetweenCaptureSchema, // Has both 'after' and 'before', must come before individual ones
  AfterCaptureSchema,
  BeforeCaptureSchema,
  LineCaptureSchema,
  FullCaptureSchema, // Last: only has 'as', matches when no other field is present
]);

const RunStepSchema = z.object({
  run: z.string(),
  when: ConditionSchema.optional(),
  timeout: z.number().optional(),
  retry: z.union([z.number(), z.literal('Infinity')]).optional(),
  shell: z.array(z.string()).min(1, 'shell must have at least one element').optional(),
  continue: z.boolean().optional(),
  onError: RunStepOnErrorSchema.optional(),
  captures: z.array(CaptureSchema).optional(),
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

/**
 * Check if a step contains choose or prompt (forbidden in parallel)
 */
function containsInteractiveStep(step: unknown): { found: boolean; type?: string } {
  if (!step || typeof step !== 'object') return { found: false };

  const stepObj = step as Record<string, unknown>;

  if ('choose' in stepObj) {
    return { found: true, type: 'choose' };
  }
  if ('prompt' in stepObj) {
    return { found: true, type: 'prompt' };
  }
  if ('parallel' in stepObj && Array.isArray(stepObj.parallel)) {
    for (const subStep of stepObj.parallel) {
      const result = containsInteractiveStep(subStep);
      if (result.found) return result;
    }
  }
  return { found: false };
}

// Steps allowed inside parallel blocks (no user input steps like choose/prompt)
// This prevents confusing UX where multiple prompts would compete for input
const ParallelAllowedStepSchema: z.ZodTypeAny = z.lazy(() =>
  z
    .union([
      RunStepSchema,
      z.object({
        parallel: z.array(z.lazy(() => ParallelAllowedStepSchema)), // Nested parallel also restricted
        when: ConditionSchema.optional(),
      }),
      z.object({
        fail: z.object({
          message: z.string(),
        }),
        when: ConditionSchema.optional(),
      }),
    ])
    .superRefine((val, ctx) => {
      const result = containsInteractiveStep(val);
      if (result.found) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `'${result.type}' step is not allowed inside 'parallel' block (user input cannot run in parallel)`,
        });
      }
    })
);

// Full step schema (all step types allowed at top level)
const StepSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([
    RunStepSchema,
    ChooseStepSchema,
    PromptStepSchema,
    z.object({
      parallel: z.array(ParallelAllowedStepSchema), // Parallel uses restricted schema
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
 * Profile schema: name + var (string-to-string map).
 * Values are coerced to string so YAML numbers/booleans become strings.
 */
const ProfileSchema = z.object({
  name: z.string().min(1, 'Profile name must be non-empty'),
  var: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]).transform(String)),
});

/**
 * Workflow schema
 * Note: Internal fields (_lineNumbers, _fileName, _filePath) are not validated
 * as they are added by the parser, not from the source file
 */
export const WorkflowSchema = z.object({
  name: z.string().optional(),
  baseDir: z.string().optional(),
  shell: z.array(z.string()).min(1, 'shell must have at least one element').optional(),
  profiles: z.array(ProfileSchema).optional(),
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
