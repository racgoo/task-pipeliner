export interface TimelineStep {
  stepNumber: number;
  name: string;
  startTime: number; // milliseconds from initialTimestamp
  duration: number; // milliseconds
  isParallel: boolean;
  parallelBranches?: TimelineBranch[];
}

export interface TimelineBranch {
  name: string;
  startTime: number;
  duration: number;
}
