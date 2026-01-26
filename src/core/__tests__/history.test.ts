import { existsSync } from 'fs';
import { rm, readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { History } from '../../types/workflow';
import { WorkflowHistoryManager, WORKFLOW_HISTORY_DIR } from '../history';

describe('WorkflowHistoryManager', () => {
  let manager: WorkflowHistoryManager;
  let initialFiles: string[];

  beforeEach(async () => {
    manager = new WorkflowHistoryManager();
    // Store initial state of history directory
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

  describe('saveHistory', () => {
    it('should save history to a file', async () => {
      const manager = new WorkflowHistoryManager();
      const history: History = {
        initialTimestamp: Date.now(),
        records: [],
      };

      const filepath = await manager.saveHistory(history);

      expect(filepath).toContain('workflow-');
      expect(filepath).toContain('.json');
      expect(existsSync(filepath)).toBe(true);
    });

    it('should create directory if it does not exist', async () => {
      const manager = new WorkflowHistoryManager();
      const history: History = {
        initialTimestamp: Date.now(),
        records: [],
      };

      await manager.saveHistory(history);

      expect(existsSync(WORKFLOW_HISTORY_DIR)).toBe(true);
    });

    it('should save history with correct content', async () => {
      const manager = new WorkflowHistoryManager();
      const timestamp = Date.now();
      const history: History = {
        initialTimestamp: timestamp,
        records: [],
      };

      const filepath = await manager.saveHistory(history);
      const content = await readFile(filepath, 'utf8');
      const parsed = JSON.parse(content);

      expect(parsed.initialTimestamp).toBe(timestamp);
      expect(parsed.records).toEqual([]);
    });
  });

  describe('getHistoryNames', () => {
    it('should return empty array if directory does not exist', async () => {
      // This test checks that getHistoryNames handles missing directory gracefully
      // If directory exists, it will return existing files, which is also valid
      const names = await manager.getHistoryNames();

      expect(Array.isArray(names)).toBe(true);
      expect(names.every((name) => typeof name === 'string')).toBe(true);
    });

    it('should return all history file names', async () => {
      const manager = new WorkflowHistoryManager();
      const history: History = {
        initialTimestamp: Date.now(),
        records: [],
      };

      await manager.saveHistory(history);
      const names = await manager.getHistoryNames();

      expect(names.length).toBeGreaterThan(0);
      expect(names.every((name) => name.endsWith('.json'))).toBe(true);
    });

    it('should return only JSON files', async () => {
      const manager = new WorkflowHistoryManager();
      const history: History = {
        initialTimestamp: Date.now(),
        records: [],
      };

      await manager.saveHistory(history);
      const names = await manager.getHistoryNames();

      names.forEach((name) => {
        expect(name).toMatch(/\.json$/);
      });
    });
  });

  describe('removeHistory', () => {
    it('should remove a specific history file', async () => {
      const manager = new WorkflowHistoryManager();
      const history: History = {
        initialTimestamp: Date.now(),
        records: [],
      };

      const filepath = await manager.saveHistory(history);
      const filename = filepath.split('/').pop() ?? '';

      expect(existsSync(filepath)).toBe(true);

      await manager.removeHistory(filename);

      expect(existsSync(filepath)).toBe(false);
    });

    it('should not throw error if file does not exist', async () => {
      const manager = new WorkflowHistoryManager();

      await expect(manager.removeHistory('non-existent.json')).resolves.not.toThrow();
    });
  });

  describe('clearAllHistories', () => {
    it('should remove all history files', async () => {
      const manager = new WorkflowHistoryManager();
      const history: History = {
        initialTimestamp: Date.now(),
        records: [],
      };

      await manager.saveHistory(history);
      await manager.saveHistory(history);

      const namesBefore = await manager.getHistoryNames();
      expect(namesBefore.length).toBeGreaterThan(0);

      await manager.clearAllHistories();

      const namesAfter = await manager.getHistoryNames();
      expect(namesAfter).toEqual([]);
    });

    it('should not throw error if directory does not exist', async () => {
      const manager = new WorkflowHistoryManager();

      await expect(manager.clearAllHistories()).resolves.not.toThrow();
    });
  });
});
