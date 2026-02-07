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
   * Returns the duration of the step execution
   * @param resolved - Optional resolved values for display (substituted command, choice/prompt result)
   */
  recordEnd(
    step: Step,
    context: ExecutionContext,
    output: StepResult,
    status: StepStatus,
    resolved?: { resolvedCommand?: string; choiceValue?: string; promptValue?: string | boolean }
  ): number;
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
   * Returns the duration of the step execution
   */
  public recordEnd(
    step: Step,
    context: ExecutionContext,
    output: StepResult,
    status: StepStatus,
    resolved?: { resolvedCommand?: string; choiceValue?: string; promptValue?: string | boolean }
  ): number {
    const duration = this.getDuration();
    this.records.push({
      step,
      context,
      output,
      duration,
      status,
      ...resolved,
    });
    return duration;
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
  public getDuration(): number {
    return Date.now() - this.recordStartTimestamp;
  }

  /**
   * Get the current history object (without saving to disk)
   */
  public getHistory(): History {
    return {
      initialTimestamp: this.initialTimestamp,
      records: this.records,
    };
  }
}

export { WorkflowRecorder };
