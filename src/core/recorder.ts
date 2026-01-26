import { History, Record, Step, StepResult, StepStatus } from '../types/workflow';
import { ExecutionContext } from './executor';
import { WorkflowHistoryManager } from './history';

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
  public async save(): Promise<string> {
    // Create storage directory if it doesn't exist
    const historyManager = new WorkflowHistoryManager();
    // Create history object
    const resultJson: History = {
      initialTimestamp: this.initialTimestamp,
      records: this.records,
    };
    // Save history to file
    return await historyManager.saveHistory(resultJson);
  }

  /**
   * Get the duration since the recorder was initialized or last reset
   */
  private getDuration(): number {
    return Date.now() - this.recordStartTimestamp;
  }
}

export { WorkflowRecorder };
