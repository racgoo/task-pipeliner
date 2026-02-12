import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { History, Record as WorkflowRecord } from '../../types/workflow';
import { displayHistory, displayRecord } from '../history-display';

describe('HistoryDisplay', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('displayHistory()', () => {
    it('should display history with header and records', () => {
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

      displayHistory(history, 'test-workflow.yaml');

      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      // Should contain history header
      const headerCall = calls.find((call) =>
        call[0]?.toString().includes('Workflow Execution History')
      );
      expect(headerCall).toBeDefined();
    });

    it('should display success and failure counts', () => {
      const history: History = {
        initialTimestamp: Date.now(),
        records: [
          {
            step: { run: 'echo "success"' },
            status: 'success',
            duration: 100,
            context: { stepIndex: 0 },
          },
          {
            step: { run: 'exit 1' },
            status: 'failure',
            duration: 50,
            context: { stepIndex: 1 },
          },
        ],
      };

      displayHistory(history, 'test-workflow.yaml');

      expect(consoleLogSpy).toHaveBeenCalled();
      const allCalls = consoleLogSpy.mock.calls.map((call) => call[0]?.toString() || '').join(' ');
      expect(allCalls).toContain('Successful');
      expect(allCalls).toContain('Failed');
    });

    it('should display timeline', () => {
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

      displayHistory(history, 'test-workflow.yaml');

      expect(consoleLogSpy).toHaveBeenCalled();
      // Timeline should be generated and displayed
      const calls = consoleLogSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });

    it('should handle empty records', () => {
      const history: History = {
        initialTimestamp: Date.now(),
        records: [],
      };

      displayHistory(history, 'test-workflow.yaml');

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('displayRecord()', () => {
    it('should display success record', () => {
      const record: WorkflowRecord = {
        step: { run: 'echo "test"' },
        status: 'success',
        duration: 100,
        context: { stepIndex: 0 },
      };

      displayRecord(record, 1, 1);

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0]?.[0]?.toString() || '';
      expect(call).toContain('Step 1/1');
      expect(call).toContain('Run');
    });

    it('should display failure record', () => {
      const record: WorkflowRecord = {
        step: { run: 'exit 1' },
        status: 'failure',
        duration: 50,
        context: { stepIndex: 0 },
      };

      displayRecord(record, 1, 1);

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0]?.[0]?.toString() || '';
      expect(call).toContain('Step 1/1');
    });

    it('should display run step with resolved command', () => {
      const record: WorkflowRecord = {
        step: { run: 'echo {{version}}' },
        status: 'success',
        duration: 100,
        context: { stepIndex: 0 },
        resolvedCommand: 'echo 1.0.0',
      };

      displayRecord(record, 1, 1);

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0]?.[0]?.toString() || '';
      expect(call).toContain('Command:');
    });

    it('should display choose step with selected value', () => {
      const record: WorkflowRecord = {
        step: {
          choose: {
            message: 'Select option',
            options: [
              { id: 'opt1', label: 'Option 1' },
              { id: 'opt2', label: 'Option 2' },
            ],
          },
        },
        status: 'success',
        duration: 50,
        context: { stepIndex: 0 },
        choiceValue: 'opt1',
      };

      displayRecord(record, 1, 1);

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0]?.[0]?.toString() || '';
      expect(call).toContain('Choose');
      expect(call).toContain('Selected:');
    });

    it('should display prompt step with entered value', () => {
      const record: WorkflowRecord = {
        step: {
          prompt: {
            message: 'Enter name',
            as: 'name',
          },
        },
        status: 'success',
        duration: 50,
        context: { stepIndex: 0 },
        promptValue: 'test-name',
      };

      displayRecord(record, 1, 1);

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0]?.[0]?.toString() || '';
      expect(call).toContain('Prompt');
      expect(call).toContain('Entered:');
    });

    it('should display parallel step', () => {
      const record: WorkflowRecord = {
        step: {
          parallel: [{ run: 'echo "task1"' }, { run: 'echo "task2"' }],
        },
        status: 'success',
        duration: 200,
        context: { stepIndex: 0 },
      };

      displayRecord(record, 1, 1);

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0]?.[0]?.toString() || '';
      expect(call).toContain('Parallel');
    });

    it('should display fail step', () => {
      const record: WorkflowRecord = {
        step: {
          fail: {
            message: 'Error occurred',
          },
        },
        status: 'failure',
        duration: 0,
        context: { stepIndex: 0 },
      };

      displayRecord(record, 1, 1);

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0]?.[0]?.toString() || '';
      expect(call).toContain('Fail');
      expect(call).toContain('Error:');
    });

    it('should display task output when available', () => {
      const record: WorkflowRecord = {
        step: { run: 'echo "test"' },
        status: 'success',
        duration: 100,
        context: { stepIndex: 0 },
        output: {
          success: true,
          stdout: ['test output'],
          stderr: [],
        },
      };

      displayRecord(record, 1, 1);

      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls;
      // Should have output display
      expect(calls.length).toBeGreaterThan(1);
    });

    it('should display stderr when available', () => {
      const record: WorkflowRecord = {
        step: { run: 'echo "error" >&2' },
        status: 'failure',
        duration: 100,
        context: { stepIndex: 0 },
        output: {
          success: false,
          stdout: [],
          stderr: ['error message'],
        },
      };

      displayRecord(record, 1, 1);

      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(1);
    });
  });
});
