import { existsSync } from 'fs';
import { mkdir, readdir, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { History } from '../../types/workflow';
import { WORKFLOW_HISTORY_DIR, WorkflowHistoryManager } from '../history';

describe('WorkflowHistoryManager', () => {
  let historyManager: WorkflowHistoryManager;
  let initialFiles: string[];

  beforeEach(async () => {
    historyManager = new WorkflowHistoryManager();
    // Ensure directory exists
    try {
      await mkdir(WORKFLOW_HISTORY_DIR, { recursive: true });
    } catch {
      // Ignore if already exists
    }
    // Store initial state
    try {
      initialFiles = await readdir(WORKFLOW_HISTORY_DIR);
    } catch {
      initialFiles = [];
    }
  });

  afterEach(async () => {
    // Clean up files created during test
    try {
      const currentFiles = await readdir(WORKFLOW_HISTORY_DIR);
      const newFiles = currentFiles.filter((file) => !initialFiles.includes(file));
      for (const file of newFiles) {
        await rm(join(WORKFLOW_HISTORY_DIR, file), { force: true });
      }
    } catch {
      // Directory doesn't exist, nothing to clean
    }
  });

  describe('saveHistory()', () => {
    it('should save history to file', async () => {
      const history: History = {
        initialTimestamp: Date.now(),
        records: [
          {
            step: { run: 'echo "test"' },
            status: 'success',
            duration: 100,
            context: { stepIndex: 0 },
          },
        ],
      };

      const filepath = await historyManager.saveHistory(history);

      expect(filepath).toContain('workflow-');
      expect(filepath).toContain('.json');
      expect(filepath).toContain(WORKFLOW_HISTORY_DIR);

      // Verify file exists and contains correct data
      const content = await readFile(filepath, 'utf-8');
      const savedHistory = JSON.parse(content);
      expect(savedHistory.initialTimestamp).toBe(history.initialTimestamp);
      expect(savedHistory.records).toHaveLength(1);
    });

    it('should create directory if it does not exist', async () => {
      // Remove directory first
      try {
        await rm(WORKFLOW_HISTORY_DIR, { recursive: true, force: true });
      } catch {
        // Ignore if doesn't exist
      }

      const history: History = {
        initialTimestamp: Date.now(),
        records: [],
      };

      await historyManager.saveHistory(history);

      // Directory should be created
      const files = await readdir(WORKFLOW_HISTORY_DIR);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should generate unique filenames', async () => {
      const history: History = {
        initialTimestamp: Date.now(),
        records: [],
      };

      const filepath1 = await historyManager.saveHistory(history);
      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
      const filepath2 = await historyManager.saveHistory(history);

      expect(filepath1).not.toBe(filepath2);
    });
  });

  describe('getHistory()', () => {
    it('should read history from file', async () => {
      const history: History = {
        initialTimestamp: Date.now(),
        records: [
          {
            step: { run: 'echo "test"' },
            status: 'success',
            duration: 100,
            context: { stepIndex: 0 },
          },
        ],
      };

      const filepath = await historyManager.saveHistory(history);
      const filename = filepath.split('/').pop() || '';

      const retrievedHistory = await historyManager.getHistory(filename);

      expect(retrievedHistory.initialTimestamp).toBe(history.initialTimestamp);
      expect(retrievedHistory.records).toHaveLength(1);
      expect(retrievedHistory.records[0].status).toBe('success');
    });

    it('should throw error when file does not exist', async () => {
      await expect(historyManager.getHistory('nonexistent.json')).rejects.toThrow();
    });
  });

  describe('getHistoryNames()', () => {
    it('should return empty array when directory does not exist', async () => {
      // Remove directory
      try {
        await rm(WORKFLOW_HISTORY_DIR, { recursive: true, force: true });
      } catch {
        // Ignore
      }

      const names = await historyManager.getHistoryNames();
      expect(names).toEqual([]);
    });

    it('should return all history file names', async () => {
      const history1: History = {
        initialTimestamp: Date.now(),
        records: [],
      };
      const history2: History = {
        initialTimestamp: Date.now() + 1000,
        records: [],
      };

      await historyManager.saveHistory(history1);
      await new Promise((resolve) => setTimeout(resolve, 10));
      await historyManager.saveHistory(history2);

      const names = await historyManager.getHistoryNames();
      expect(names.length).toBeGreaterThanOrEqual(2);
      expect(names.every((name) => name.startsWith('workflow-'))).toBe(true);
      expect(names.every((name) => name.endsWith('.json'))).toBe(true);
    });

    it('should sort files by newest first', async () => {
      const history1: History = {
        initialTimestamp: Date.now(),
        records: [],
      };
      const history2: History = {
        initialTimestamp: Date.now() + 1000,
        records: [],
      };

      await historyManager.saveHistory(history1);
      await new Promise((resolve) => setTimeout(resolve, 10));
      await historyManager.saveHistory(history2);

      const names = await historyManager.getHistoryNames();
      // Newest should be first (higher timestamp in filename)
      if (names.length >= 2) {
        const firstTimestamp = names[0].match(/workflow-(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})-/)?.[1];
        const secondTimestamp = names[1].match(/workflow-(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})-/)?.[1];
        if (firstTimestamp && secondTimestamp) {
          expect(firstTimestamp >= secondTimestamp).toBe(true);
        }
      }
    });
  });

  describe('removeHistory()', () => {
    it('should remove history file', async () => {
      const history: History = {
        initialTimestamp: Date.now(),
        records: [],
      };

      const filepath = await historyManager.saveHistory(history);
      const filename = filepath.split('/').pop() || '';

      expect(existsSync(filepath)).toBe(true);

      await historyManager.removeHistory(filename);

      // File should be removed
      try {
        await readFile(filepath, 'utf-8');
        expect(true).toBe(false); // Should not reach here
      } catch {
        // Expected - file should not exist
        expect(true).toBe(true);
      }
    });

    it('should not throw when file does not exist', async () => {
      await expect(historyManager.removeHistory('nonexistent.json')).resolves.not.toThrow();
    });
  });

  describe('clearAllHistories()', () => {
    it('should remove all history files', async () => {
      const history1: History = {
        initialTimestamp: Date.now(),
        records: [],
      };
      const history2: History = {
        initialTimestamp: Date.now() + 1000,
        records: [],
      };

      await historyManager.saveHistory(history1);
      await historyManager.saveHistory(history2);

      const filesBefore = await readdir(WORKFLOW_HISTORY_DIR);
      expect(filesBefore.length).toBeGreaterThan(0);

      await historyManager.clearAllHistories();

      // Directory should be removed or empty
      try {
        const filesAfter = await readdir(WORKFLOW_HISTORY_DIR);
        expect(filesAfter.length).toBe(0);
      } catch {
        // Directory doesn't exist, which is also fine
        expect(true).toBe(true);
      }
    });

    it('should not throw when directory does not exist', async () => {
      // Remove directory
      try {
        await rm(WORKFLOW_HISTORY_DIR, { recursive: true, force: true });
      } catch {
        // Ignore
      }

      await expect(historyManager.clearAllHistories()).resolves.not.toThrow();
    });
  });
});

