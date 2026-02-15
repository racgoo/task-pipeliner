import type { Record as WorkflowRecord } from '@tp-types/workflow';
import type { TimelineBranch, TimelineStep } from './types';

/**
 * Group records by step index to detect parallel execution
 * PARALLEL_STEP_INDEX_MULTIPLIER = 1000
 * Parallel branches have stepIndex = baseStepIndex * 1000 + branchIndex
 */
export function groupRecordsByStepIndex(records: WorkflowRecord[]): WorkflowRecord[][] {
  const groups: WorkflowRecord[][] = [];
  const stepIndexMap = new Map<number, WorkflowRecord[]>();
  const PARALLEL_STEP_INDEX_MULTIPLIER = 1000;

  // Group all records by base step index
  // Parallel branches have stepIndex >= 1000, so divide by 1000 to get base step index
  for (const record of records) {
    let baseStepIndex: number;

    // Check if this is a parallel branch
    if (
      record.context.branchIndex !== undefined &&
      record.context.stepIndex >= PARALLEL_STEP_INDEX_MULTIPLIER
    ) {
      // Parallel branch: stepIndex = baseStepIndex * 1000 + branchIndex
      baseStepIndex = Math.floor(record.context.stepIndex / PARALLEL_STEP_INDEX_MULTIPLIER);
    } else {
      // Sequential step: stepIndex is the base step index
      baseStepIndex = record.context.stepIndex;
    }

    if (!stepIndexMap.has(baseStepIndex)) {
      stepIndexMap.set(baseStepIndex, []);
    }
    const group = stepIndexMap.get(baseStepIndex);
    if (group) {
      group.push(record);
    }
  }

  // Sort by step index and convert to array
  const sortedIndices = Array.from(stepIndexMap.keys()).sort((a, b) => a - b);
  for (const stepIndex of sortedIndices) {
    const group = stepIndexMap.get(stepIndex);
    if (group) {
      // Check if this group contains parallel branches
      // Parallel branches have branchIndex !== undefined and stepIndex >= 1000
      const parallelBranches = group.filter(
        (r) =>
          r.context.branchIndex !== undefined &&
          r.context.stepIndex >= PARALLEL_STEP_INDEX_MULTIPLIER
      );

      if (parallelBranches.length > 0) {
        // This is a parallel group
        // Sort by branchIndex to maintain order
        parallelBranches.sort((a, b) => {
          const aBranch = a.context.branchIndex ?? -1;
          const bBranch = b.context.branchIndex ?? -1;
          return aBranch - bBranch;
        });
        groups.push(parallelBranches);

        // Filter out the parallel step itself (if it was recorded) - we only want the branches
        // Parallel step itself has stepIndex < PARALLEL_STEP_INDEX_MULTIPLIER and step type is 'parallel'
        const sequentialRecords = group.filter(
          (r) =>
            (r.context.branchIndex === undefined ||
              r.context.stepIndex < PARALLEL_STEP_INDEX_MULTIPLIER) &&
            !('parallel' in r.step) // Exclude the parallel step itself
        );
        if (sequentialRecords.length > 0) {
          sequentialRecords.sort((a, b) => a.context.stepIndex - b.context.stepIndex);
          groups.push(sequentialRecords);
        }
      } else {
        // Sequential step - sort by stepIndex (should be only one, but just in case)
        group.sort((a, b) => a.context.stepIndex - b.context.stepIndex);
        groups.push(group);
      }
    }
  }

  return groups;
}

export function calculateTotalDuration(stepGroups: WorkflowRecord[][]): number {
  // For sequential steps, sum all durations
  // For parallel steps, only count the longest duration in each group
  let totalDuration = 0;
  for (const group of stepGroups) {
    if (group.length > 1) {
      // Parallel group: use longest duration
      totalDuration += Math.max(...group.map((r) => r.duration));
    } else {
      // Sequential step
      totalDuration += group[0].duration;
    }
  }
  return totalDuration;
}

/**
 * Get short name for a step (for timeline display)
 * Returns name that fits in 28 character column (including "Step X: " prefix)
 * Step prefix is typically 8-10 characters, so name can be up to 18-20 characters
 */
export function getStepShortName(record: WorkflowRecord): string {
  const step = record.step;
  const maxNameLength = 28; // Leave room for "Step X: " prefix (8-10 chars), so up to 20 chars for name

  if ('run' in step) {
    const cmd = record.resolvedCommand ?? step.run;
    // Truncate long commands
    if (cmd.length > maxNameLength) {
      return `${cmd.substring(0, maxNameLength - 2)}..`;
    }
    return cmd;
  } else if ('choose' in step) {
    const msg = step.choose.message;
    if (msg.length > maxNameLength) {
      return `${msg.substring(0, maxNameLength - 2)}..`;
    }
    return msg;
  } else if ('prompt' in step) {
    const msg = step.prompt.message;
    if (msg.length > maxNameLength) {
      return `${msg.substring(0, maxNameLength - 2)}..`;
    }
    return msg;
  } else if ('parallel' in step) {
    return `Parallel`;
  } else if ('fail' in step) {
    const msg = step.fail.message;
    if (msg.length > maxNameLength) {
      return `${msg.substring(0, maxNameLength - 2)}..`;
    }
    return msg;
  }

  return 'Unknown';
}

export function findSlowestRecord(records: WorkflowRecord[]): WorkflowRecord {
  return records.reduce((slowest, record) =>
    record.duration > slowest.duration ? record : slowest
  );
}

export function buildTimelineSteps(stepGroups: WorkflowRecord[][]): TimelineStep[] {
  const timelineSteps: TimelineStep[] = [];
  let currentTime = 0; // milliseconds from initialTimestamp

  for (let i = 0; i < stepGroups.length; i++) {
    const group = stepGroups[i];
    // Check if this is a parallel group:
    // Parallel branches have branchIndex !== undefined and stepIndex >= 1000
    // A parallel group must have at least 1 branch with branchIndex
    const hasParallelBranches = group.some(
      (r) => r.context.branchIndex !== undefined && r.context.stepIndex >= 1000
    );
    const isParallel = hasParallelBranches && group.length >= 1;

    if (isParallel && group.length > 0) {
      // Use all records in the group (they are all parallel branches)
      const recordsToUse = group;

      // Parallel execution group
      // All branches start at the same time
      const parallelBranches: TimelineBranch[] = recordsToUse.map((record) => ({
        name: getStepShortName(record),
        startTime: currentTime,
        duration: record.duration,
      }));

      // Parallel group duration is the longest branch duration
      const groupDuration = Math.max(...recordsToUse.map((r) => r.duration));

      timelineSteps.push({
        stepNumber: i + 1,
        name: `Parallel`,
        startTime: currentTime,
        duration: groupDuration,
        isParallel: true,
        parallelBranches,
      });

      currentTime += groupDuration;
    } else {
      // Sequential step (single record, no parallel branches)
      const record = group[0];
      const stepName = getStepShortName(record);
      // Ensure step name is not empty
      const finalStepName = stepName || 'Unknown';
      timelineSteps.push({
        stepNumber: i + 1,
        name: finalStepName,
        startTime: currentTime,
        duration: record.duration,
        isParallel: false,
      });

      currentTime += record.duration;
    }
  }

  return timelineSteps;
}
