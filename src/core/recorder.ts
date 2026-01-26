import { mkdir, rm, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import dayjs from 'dayjs';
import { Record, Step, StepResult, StepStatus } from '../types/workflow';
import { ExecutionContext } from './executor';

/**
 * Default directory for storing workflow execution history
 * Located at ~/.pipeliner/workflow-history/
 */
const WORKFLOW_HISTORY_DIR = join(homedir(), '.pipeliner', 'workflow-history');

/**
 * Interface for recording workflow step execution
 */
export interface Recorder {
  /**
   * Record the start of a step execution (initial timestamp for duration calculation)
   */
  recordStart(): void;
  /**
   * Record a step execution with its result and status
   */
  recordEnd(step: Step, context: ExecutionContext, output: StepResult, status: StepStatus): void;
}

/**
 * WorkflowRecorder
 *
 * Records workflow execution history and saves it to disk.
 * Stores execution records in ~/.pipeliner/workflow-history/ directory.
 */
class WorkflowRecorder implements Recorder {
  private records: Record[] = [];
  private initialTimestamp = Date.now();
  private recordStartTimestamp = Date.now();

  constructor() {
    this.records = [];
  }

  public recordStart(): void {
    this.recordStartTimestamp = Date.now();
  }

  /**
   * Record a step execution
   */
  public recordEnd(
    step: Step,
    context: ExecutionContext,
    output: StepResult,
    status: StepStatus
  ): void {
    const duration = this.getDuration();
    this.records.push({ step, context, output, duration, status });
  }

  /**
   * Reset the recorder, clearing all records and resetting the timestamp
   */
  public reset() {
    this.records = [];
    this.initialTimestamp = Date.now();
  }

  /**
   * Save execution records to a JSON file
   * Creates the storage directory if it doesn't exist.
   * Generates a timestamp-based filename with random hash if filename is not provided.
   */
  public async save(filename?: string): Promise<string> {
    // Create storage directory if it doesn't exist
    await mkdir(WORKFLOW_HISTORY_DIR, { recursive: true });

    // Generate filename with timestamp and random hash
    const dateFormat = dayjs().format('YYYYMMDDHHmmss');
    const hash = Math.random().toString(36).slice(2, 6);
    const filepath = join(WORKFLOW_HISTORY_DIR, filename ?? `workflow-${dateFormat}-${hash}.json`);

    // Save records as JSON
    await writeFile(filepath, JSON.stringify(this.records, null, 2), { encoding: 'utf8' });
    return filepath;
  }

  /**
   * Clear the storage directory
   */
  public async clearStorage(): Promise<void> {
    // Remove the storage directory and all its contents
    await rm(WORKFLOW_HISTORY_DIR, { recursive: true, force: true });
  }

  /**
   * Get the duration since the recorder was initialized or last reset
   */
  private getDuration(): number {
    return Date.now() - this.recordStartTimestamp;
  }
}

export { WorkflowRecorder };
