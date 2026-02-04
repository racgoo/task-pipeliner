/**
 * Zod schema for schedule file validation
 */

import { z } from 'zod';

/**
 * Individual schedule definition schema
 */
export const ScheduleDefinitionSchema = z.object({
  name: z.string().min(1, 'Schedule name must be non-empty'),
  cron: z.string().min(1, 'Cron expression is required'),
  workflow: z.string().min(1, 'Workflow path is required'),
  baseDir: z.string().optional(),
  silent: z.boolean().optional(),
  profile: z.string().optional(),
});

/**
 * Schedule file schema
 */
export const ScheduleFileSchema = z.object({
  schedules: z
    .array(ScheduleDefinitionSchema)
    .min(1, 'Schedule file must have at least one schedule'),
});

/**
 * Validate schedule file
 */
export function validateScheduleFile(data: unknown): z.infer<typeof ScheduleFileSchema> {
  return ScheduleFileSchema.parse(data);
}

/**
 * Safe validate schedule file
 */
export function safeValidateScheduleFile(data: unknown): {
  success: boolean;
  data?: z.infer<typeof ScheduleFileSchema>;
  error?: z.ZodError;
} {
  const result = ScheduleFileSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
