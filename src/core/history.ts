import { mkdir, readdir, readFile, rm, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { basename, join } from 'path';
import dayjs from 'dayjs';
import { History } from '../types/workflow';

/**
 * Default directory for storing workflow execution history
 * Located at ~/.pipeliner/workflow-history/
 */
export const WORKFLOW_HISTORY_DIR = join(homedir(), '.pipeliner', 'workflow-history');

/**
 * Interface for managing workflow execution history
 */
interface HistoryManager {
  /**
   * Save workflow execution history to a file
   */
  saveHistory(history: History): Promise<string>;
  /**
   * Clear all stored workflow execution histories
   */
  clearAllHistories(): Promise<void>;
  /**
   * Get all history file names
   */
  getHistoryNames(): Promise<string[]>;
}

/**
 * WorkflowHistoryManager
 *
 * Manages workflow execution history storage and retrieval.
 * Handles saving, listing, and clearing workflow execution records.
 */
export class WorkflowHistoryManager implements HistoryManager {
  constructor() {}

  /**
   * Save history to file
   * Creates the storage directory if it doesn't exist.
   * Generates a timestamp-based filename with random hash.
   */
  public async saveHistory(history: History): Promise<string> {
    // Create storage directory if it doesn't exist
    await mkdir(WORKFLOW_HISTORY_DIR, { recursive: true });

    // Generate filename with timestamp and random hash
    const dateFormat = dayjs().format('YYYY-MM-DD_HH-mm-ss');
    const hash = Math.random().toString(36).slice(2, 6);
    const filepath = join(WORKFLOW_HISTORY_DIR, `workflow-${dateFormat}-${hash}.json`);

    // Save history to file
    await writeFile(filepath, JSON.stringify(history, null, 2), { encoding: 'utf8' });
    return filepath;
  }

  /**
   * Clear the storage directory
   * Removes all workflow execution history files.
   */
  public async clearAllHistories(): Promise<void> {
    // Remove the storage directory and all its contents
    await rm(WORKFLOW_HISTORY_DIR, { recursive: true, force: true });
  }

  public async removeHistory(filename: string): Promise<void> {
    // Remove the history file
    await rm(join(WORKFLOW_HISTORY_DIR, filename), { force: true });
  }

  /**
   * Get all history names
   * Returns an array of all history file names in the storage directory, sorted by newest first.
   * Returns empty array if directory doesn't exist.
   */
  public async getHistoryNames(): Promise<string[]> {
    try {
      // Get all files in the storage directory
      const files = await readdir(WORKFLOW_HISTORY_DIR);
      const fileNames = files.map((file) => basename(file));

      // Sort by timestamp in filename (newest first)
      // Filename format: workflow-YYYY-MM-DD_HH-mm-ss-<hash>.json
      fileNames.sort((a, b) => {
        // Extract timestamp from filename
        const extractTimestamp = (filename: string): string => {
          const match = filename.match(/workflow-(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})-/);
          return match ? match[1] : '';
        };
        const timestampA = extractTimestamp(a);
        const timestampB = extractTimestamp(b);
        // If timestamps are equal, compare by hash (alphabetically)
        if (timestampA === timestampB) {
          return b.localeCompare(a); // Reverse order for hash comparison
        }
        // Compare timestamps (newest first = descending order)
        return timestampB.localeCompare(timestampA);
      });

      return fileNames;
    } catch (error) {
      // Directory doesn't exist or is empty
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get history from file
   * Reads the history file and returns the history object.
   */
  public async getHistory(filename: string): Promise<History> {
    // Read the history file
    const content = await readFile(join(WORKFLOW_HISTORY_DIR, filename), { encoding: 'utf8' });
    return JSON.parse(content);
  }
}
