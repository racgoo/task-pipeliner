import { readFile, writeFile, mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Schedule } from '@tp-types/schedule';
import type { SchedulerOutputPort } from '../execution/ports';
import { ScheduleManager } from '../scheduling/schedule-manager';
import { WorkflowScheduler } from '../scheduling/scheduler';
import { createTestScheduler } from './test-helpers';

// Mock dependencies - create a shared mock execute function
const mockExecute = vi.fn().mockResolvedValue(undefined);

vi.mock('../parsing/parser', () => ({
  getParser: vi.fn().mockReturnValue({
    parse: vi.fn().mockReturnValue({
      steps: [{ run: 'echo "test"' }],
      profiles: [],
    }),
  }),
}));

vi.mock('node-cron', () => {
  const mockTask = {
    stop: vi.fn(),
  };
  return {
    default: {
      validate: vi.fn((cron: string) => cron.startsWith('0') || cron === '* * * * *'),
      schedule: vi.fn((_cron: string, callback: () => void, _options?: any) => {
        // Store callback for testing
        (mockTask as any)._callback = callback;
        return mockTask;
      }),
    },
  };
});

vi.mock('../scheduling/daemon-manager', () => ({
  isDaemonRunning: vi.fn().mockResolvedValue(false),
  getDaemonStatus: vi.fn().mockResolvedValue({
    running: false,
    pid: null,
    startTime: null,
  }),
  removeDaemonPid: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('fs/promises', async () => {
  const actual = await vi.importActual<typeof import('fs/promises')>('fs/promises');
  return {
    ...actual,
    readFile: vi.fn(),
  };
});

describe('WorkflowScheduler', () => {
  let scheduler: WorkflowScheduler;
  let scheduleManager: ScheduleManager;
  let tempDir: string;
  const schedulerOutputPort: SchedulerOutputPort = {
    showSchedulerStart: vi.fn(),
    showSchedulerStarted: vi.fn(),
    showSchedulerStopping: vi.fn(),
    showNoEnabledSchedules: vi.fn(),
    showScheduleStartFailed: vi.fn(),
    showInvalidCronExpression: vi.fn(),
    showCronScheduleFailed: vi.fn(),
    showScheduledWorkflowStart: vi.fn(),
    showScheduledWorkflowCompleted: vi.fn(),
    showScheduledWorkflowFailed: vi.fn(),
  };

  beforeEach(async () => {
    scheduleManager = new ScheduleManager();
    scheduler = createTestScheduler({
      outputPort: schedulerOutputPort,
      executor: { execute: mockExecute },
      scheduleManager,
    });
    tempDir = await mkdtemp(join(tmpdir(), 'scheduler-test-'));
    vi.clearAllMocks();
    mockExecute.mockClear();
  });

  afterEach(async () => {
    scheduler.stop();
    if (tempDir) {
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('start()', () => {
    it('should start scheduler in normal mode', async () => {
      vi.spyOn(scheduleManager, 'loadSchedules').mockResolvedValue([]);

      // Access private scheduleManager through any
      (scheduler as any).scheduleManager = scheduleManager;

      await scheduler.start(false);

      expect(scheduleManager.loadSchedules).toHaveBeenCalled();
    });

    it('should start scheduler in daemon mode', async () => {
      vi.spyOn(scheduleManager, 'loadSchedules').mockResolvedValue([]);
      (scheduler as any).scheduleManager = scheduleManager;

      await scheduler.start(true);

      expect(scheduleManager.loadSchedules).toHaveBeenCalled();
    });

    it('should throw error when daemon is already running', async () => {
      const { isDaemonRunning } = await import('../scheduling/daemon-manager');
      vi.mocked(isDaemonRunning).mockResolvedValue(true);

      await expect(scheduler.start(false)).rejects.toThrow('already running');
    });
  });

  describe('reload()', () => {
    it('should load and start enabled schedules', async () => {
      const schedules: Schedule[] = [
        {
          id: 'test1',
          name: 'Test Schedule',
          cron: '0 9 * * *',
          workflowPath: './test.yaml',
          enabled: true,
          createdAt: new Date().toISOString(),
        },
      ];

      vi.spyOn(scheduleManager, 'loadSchedules').mockResolvedValue(schedules);
      (scheduler as any).scheduleManager = scheduleManager;

      const cron = await import('node-cron');
      vi.mocked(cron.default.validate).mockReturnValue(true);

      await scheduler.reload();

      expect(scheduleManager.loadSchedules).toHaveBeenCalled();
      expect(cron.default.schedule).toHaveBeenCalled();
    });

    it('should skip disabled schedules', async () => {
      const schedules: Schedule[] = [
        {
          id: 'test1',
          name: 'Disabled Schedule',
          cron: '0 9 * * *',
          workflowPath: './test.yaml',
          enabled: false,
          createdAt: new Date().toISOString(),
        },
      ];

      vi.spyOn(scheduleManager, 'loadSchedules').mockResolvedValue(schedules);
      (scheduler as any).scheduleManager = scheduleManager;

      const cron = await import('node-cron');

      await scheduler.reload();

      expect(scheduleManager.loadSchedules).toHaveBeenCalled();
      expect(cron.default.schedule).not.toHaveBeenCalled();
    });

    it('should stop existing tasks before reloading', async () => {
      const schedules: Schedule[] = [
        {
          id: 'test1',
          name: 'Test Schedule',
          cron: '0 9 * * *',
          workflowPath: './test.yaml',
          enabled: true,
          createdAt: new Date().toISOString(),
        },
      ];

      vi.spyOn(scheduleManager, 'loadSchedules').mockResolvedValue(schedules);
      (scheduler as any).scheduleManager = scheduleManager;

      const cron = await import('node-cron');
      vi.mocked(cron.default.validate).mockReturnValue(true);

      // Start first time
      await scheduler.reload();
      const firstCallCount = vi.mocked(cron.default.schedule).mock.calls.length;

      // Reload again
      await scheduler.reload();
      const secondCallCount = vi.mocked(cron.default.schedule).mock.calls.length;

      // Should have been called twice (once per reload)
      expect(secondCallCount).toBeGreaterThan(firstCallCount);
    });

    it('should handle invalid cron expressions', async () => {
      const schedules: Schedule[] = [
        {
          id: 'test1',
          name: 'Invalid Cron',
          cron: 'invalid cron',
          workflowPath: './test.yaml',
          enabled: true,
          createdAt: new Date().toISOString(),
        },
      ];

      vi.spyOn(scheduleManager, 'loadSchedules').mockResolvedValue(schedules);
      (scheduler as any).scheduleManager = scheduleManager;

      const cron = await import('node-cron');
      vi.mocked(cron.default.validate).mockReturnValue(false);

      await scheduler.reload();

      expect(cron.default.schedule).not.toHaveBeenCalled();
    });
  });

  describe('stop()', () => {
    it('should stop all scheduled tasks', async () => {
      const schedules: Schedule[] = [
        {
          id: 'test1',
          name: 'Test Schedule',
          cron: '0 9 * * *',
          workflowPath: './test.yaml',
          enabled: true,
          createdAt: new Date().toISOString(),
        },
      ];

      vi.spyOn(scheduleManager, 'loadSchedules').mockResolvedValue(schedules);
      (scheduler as any).scheduleManager = scheduleManager;

      const cron = await import('node-cron');
      vi.mocked(cron.default.validate).mockReturnValue(true);

      await scheduler.reload();

      const mockTask = vi.mocked(cron.default.schedule).mock.results[0]?.value;
      expect(mockTask).toBeDefined();

      scheduler.stop();

      if (mockTask && typeof mockTask.stop === 'function') {
        expect(mockTask.stop).toHaveBeenCalled();
      }
    });

    it('should clear tasks map', async () => {
      const schedules: Schedule[] = [
        {
          id: 'test1',
          name: 'Test Schedule',
          cron: '0 9 * * *',
          workflowPath: './test.yaml',
          enabled: true,
          createdAt: new Date().toISOString(),
        },
      ];

      vi.spyOn(scheduleManager, 'loadSchedules').mockResolvedValue(schedules);
      (scheduler as any).scheduleManager = scheduleManager;

      const cron = await import('node-cron');
      vi.mocked(cron.default.validate).mockReturnValue(true);

      await scheduler.reload();

      // Access private tasks map
      const tasksBefore = (scheduler as any).tasks;
      expect(tasksBefore.size).toBeGreaterThan(0);

      scheduler.stop();

      const tasksAfter = (scheduler as any).tasks;
      expect(tasksAfter.size).toBe(0);
    });
  });

  describe('executeSchedule()', () => {
    it('should execute workflow for schedule', async () => {
      const schedule: Schedule = {
        id: 'test1',
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: join(tempDir, 'test.yaml'),
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      const { getParser } = await import('../parsing/parser');
      const { readFile } = await import('fs/promises');

      vi.mocked(readFile).mockResolvedValue('steps:\n  - run: echo "test"');

      // Access private method through any
      await (scheduler as any).executeSchedule(schedule);

      expect(getParser).toHaveBeenCalledWith(schedule.workflowPath);
      expect(readFile).toHaveBeenCalledWith(schedule.workflowPath, 'utf-8');
    });

    it('should update last run time after execution', async () => {
      const schedule: Schedule = {
        id: 'test1',
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: join(tempDir, 'test.yaml'),
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      vi.spyOn(scheduleManager, 'updateLastRun').mockResolvedValue(undefined);
      (scheduler as any).scheduleManager = scheduleManager;

      const { readFile } = await import('fs/promises');
      vi.mocked(readFile).mockResolvedValue('steps:\n  - run: echo "test"');

      await (scheduler as any).executeSchedule(schedule);

      expect(scheduleManager.updateLastRun).toHaveBeenCalledWith(schedule.id);
    });

    it('should handle execution errors gracefully', async () => {
      const schedule: Schedule = {
        id: 'test1',
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: join(tempDir, 'test.yaml'),
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      mockExecute.mockRejectedValueOnce(new Error('Execution failed'));

      const { readFile } = await import('fs/promises');
      vi.mocked(readFile).mockResolvedValue('steps:\n  - run: echo "test"');

      // Should not throw
      await expect((scheduler as any).executeSchedule(schedule)).resolves.not.toThrow();
    });

    it('should apply profile when specified', async () => {
      const schedule: Schedule = {
        id: 'test1',
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: join(tempDir, 'test.yaml'),
        enabled: true,
        createdAt: new Date().toISOString(),
        profile: 'production',
      };

      const { getParser } = await import('../parsing/parser');
      const { readFile } = await import('fs/promises');

      const mockWorkflow = {
        steps: [{ run: 'echo "test"' }],
        profiles: [
          {
            name: 'production',
            var: { env: 'prod' },
          },
        ],
        _filePath: schedule.workflowPath,
        _fileName: 'test.yaml',
      };

      vi.mocked(readFile).mockResolvedValue('steps:\n  - run: echo "test"');
      vi.mocked(getParser).mockReturnValue({
        parse: vi.fn().mockReturnValue(mockWorkflow),
      });

      // Clear previous calls
      mockExecute.mockClear();

      await (scheduler as any).executeSchedule(schedule);

      // Check that the shared mock execute was called
      expect(mockExecute).toHaveBeenCalledWith(
        expect.objectContaining({
          steps: expect.any(Array),
          profiles: expect.any(Array),
        }),
        expect.objectContaining({
          executionVars: expect.objectContaining({ env: 'prod' }),
        })
      );
    });
  });

  describe('stopDaemon()', () => {
    it('should return false when daemon is not running', async () => {
      const { getDaemonStatus } = await import('../scheduling/daemon-manager');
      vi.mocked(getDaemonStatus).mockResolvedValue({
        running: false,
        pid: null,
        startTime: null,
      });

      const result = await scheduler.stopDaemon();
      expect(result).toBe(false);
    });

    it('should send SIGTERM to daemon process', async () => {
      const { getDaemonStatus, isDaemonRunning } = await import('../scheduling/daemon-manager');
      const mockKill = vi.spyOn(process, 'kill').mockImplementation(() => true);

      vi.mocked(getDaemonStatus).mockResolvedValue({
        running: true,
        pid: 12345,
        startTime: new Date().toISOString(),
      });
      vi.mocked(isDaemonRunning).mockResolvedValue(false);

      const result = await scheduler.stopDaemon();

      expect(mockKill).toHaveBeenCalledWith(12345, 'SIGTERM');
      expect(result).toBe(true);

      mockKill.mockRestore();
    });
  });
});
