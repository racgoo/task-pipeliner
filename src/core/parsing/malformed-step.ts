/**
 * Fix malformed step (YAML indentation issue)
 * When choose/prompt is null but properties exist at step level.
 */
export function fixMalformedStep(step: unknown): unknown {
  const stepAsRecord = step as Record<string, unknown>;

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

  if ('parallel' in stepAsRecord && Array.isArray(stepAsRecord.parallel)) {
    return {
      ...stepAsRecord,
      parallel: stepAsRecord.parallel.map((subStep: unknown) => fixMalformedStep(subStep)),
    };
  }

  return step;
}
