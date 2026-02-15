import { existsSync } from 'fs';
import { mkdir, readFile, readdir, rm } from 'fs/promises';
import { join } from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Step, StepResult, StepStatus } from '@tp-types/workflow';
import type { ExecutionContext } from '../execution/executor';
import { WORKFLOW_HISTORY_DIR } from '../history/manager';
import { WorkflowRecorder } from '../history/recorder';
import { Workspace } from '../workflow/workspace';

describe('WorkflowRecorder', () => {
  let recorder: WorkflowRecorder;
  let mockContext: ExecutionContext;
  let initialFiles: string[];

  beforeEach(async () => {
    recorder = new WorkflowRecorder();
    mockContext = {
      workspace: new Workspace(),
      stepIndex: 0,
    };
    // Ensure directory exists
    try {
      await mkdir(WORKFLOW_HISTORY_DIR, { recursive: true });
    } catch {
      // Ignore if already exists
    }
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
    // Ensure directory exists after cleanup (in case clearAllHistories was called in other tests)
    try {
      await mkdir(WORKFLOW_HISTORY_DIR, { recursive: true });
    } catch {
      // Ignore if already exists
    }
  });

  describe('recordStart', () => {
    it('should record start timestamp', () => {
      expect(() => recorder.recordStart()).not.toThrow();
    });
  });

  describe('recordEnd', () => {
    it('should record a step execution', async () => {
      const step: Step = { run: 'echo test' };
      const output: StepResult = { success: true, stdout: ['test'], stderr: [] };
      const status: StepStatus = 'success';

      recorder.recordStart();
      recorder.recordEnd(step, mockContext, output, status);

      const filepath = await recorder.save();
      const content = await readFile(filepath, 'utf8');
      const parsed = JSON.parse(content);

      expect(parsed.records).toHaveLength(1);
      expect(parsed.records[0].step).toEqual(step);
      expect(parsed.records[0].output).toEqual(output);
      expect(parsed.records[0].status).toBe(status);
    });

    it('should record multiple steps', async () => {
      const step1: Step = { run: 'echo step1' };
      const step2: Step = { run: 'echo step2' };
      const output: StepResult = { success: true, stdout: [], stderr: [] };

      recorder.recordStart();
      recorder.recordEnd(step1, mockContext, output, 'success');
      recorder.recordEnd(step2, mockContext, output, 'success');

      const filepath = await recorder.save();
      const content = await readFile(filepath, 'utf8');
      const parsed = JSON.parse(content);

      expect(parsed.records).toHaveLength(2);
      expect(parsed.records[0].step).toEqual(step1);
      expect(parsed.records[1].step).toEqual(step2);
    });

    it('should record step with failure status', async () => {
      const step: Step = { run: 'false' };
      const output: StepResult = { success: false, stdout: [], stderr: ['error'] };
      const status: StepStatus = 'failure';

      recorder.recordStart();
      recorder.recordEnd(step, mockContext, output, status);

      const filepath = await recorder.save();
      const content = await readFile(filepath, 'utf8');
      const parsed = JSON.parse(content);

      expect(parsed.records).toHaveLength(1);
      expect(parsed.records[0].status).toBe('failure');
      expect(parsed.records[0].output).toEqual(output);
    });
  });

  describe('reset', () => {
    it('should clear all records', async () => {
      const step: Step = { run: 'echo test' };
      const output: StepResult = { success: true, stdout: [], stderr: [] };

      recorder.recordStart();
      recorder.recordEnd(step, mockContext, output, 'success');
      recorder.reset();

      const filepath = await recorder.save();
      const content = await readFile(filepath, 'utf8');
      const parsed = JSON.parse(content);

      expect(parsed.records).toHaveLength(0);
    });

    it('should reset timestamp', async () => {
      const initialTimestamp = Date.now();
      recorder.recordStart();
      recorder.reset();

      const filepath = await recorder.save();
      const content = await readFile(filepath, 'utf8');
      const parsed = JSON.parse(content);

      // New initialTimestamp should be after reset
      expect(parsed.initialTimestamp).toBeGreaterThanOrEqual(initialTimestamp);
    });
  });

  describe('save', () => {
    it('should save records to file', async () => {
      // Ensure directory exists
      await mkdir(WORKFLOW_HISTORY_DIR, { recursive: true });

      const step: Step = { run: 'echo test' };
      const output: StepResult = { success: true, stdout: ['test'], stderr: [] };

      recorder.recordStart();
      recorder.recordEnd(step, mockContext, output, 'success');

      const filepath = await recorder.save();

      expect(filepath).toContain('workflow-');
      expect(filepath).toContain('.json');
      expect(existsSync(filepath)).toBe(true);
    });

    it('should save empty records', async () => {
      // Ensure directory exists
      await mkdir(WORKFLOW_HISTORY_DIR, { recursive: true });

      recorder.recordStart();

      const filepath = await recorder.save();
      const content = await readFile(filepath, 'utf8');
      const parsed = JSON.parse(content);

      expect(filepath).toContain('.json');
      expect(parsed.records).toEqual([]);
      expect(parsed.initialTimestamp).toBeDefined();
    });

    it('should save history with initial timestamp', async () => {
      // Ensure directory exists
      try {
        await mkdir(WORKFLOW_HISTORY_DIR, { recursive: true });
      } catch {
        // Ignore if already exists
      }

      const timestamp = Date.now();
      const recorderWithTimestamp = new WorkflowRecorder();
      recorderWithTimestamp.recordStart();
      const filepath = await recorderWithTimestamp.save();
      const content = await readFile(filepath, 'utf8');
      const parsed = JSON.parse(content);

      expect(filepath).toContain('.json');
      expect(filepath).toContain('workflow-');
      expect(parsed.initialTimestamp).toBeGreaterThanOrEqual(timestamp);
    });
  });
});
