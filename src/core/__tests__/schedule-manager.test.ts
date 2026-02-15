import { existsSync } from 'fs';
import { mkdir, readFile, rm, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Schedule } from '@tp-types/schedule';
import { ScheduleManager, SCHEDULE_DIR } from '../schedule-manager';

describe('ScheduleManager', () => {
  let scheduleManager: ScheduleManager;
  let initialSchedules: Schedule[];

  beforeEach(async () => {
    scheduleManager = new ScheduleManager();
    // Store initial schedules
    try {
      initialSchedules = await scheduleManager.loadSchedules();
    } catch {
      initialSchedules = [];
    }
  });

  afterEach(async () => {
    // Clean up: restore initial state
    try {
      const currentSchedules = await scheduleManager.loadSchedules();
      const newSchedules = currentSchedules.filter(
        (s) => !initialSchedules.some((init) => init.id === s.id)
      );
      // Remove new schedules
      for (const schedule of newSchedules) {
        await scheduleManager.removeSchedule(schedule.id);
      }
      // Restore initial schedules if needed
      if (initialSchedules.length > 0) {
        await scheduleManager.saveSchedules(initialSchedules);
      } else {
        // If no initial schedules, ensure file is clean
        const scheduleFile = join(SCHEDULE_DIR, 'schedules.json');
        if (existsSync(scheduleFile)) {
          const current = await scheduleManager.loadSchedules();
          if (current.length === 0) {
            await unlink(scheduleFile).catch(() => {});
          }
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('loadSchedules()', () => {
    it('should return empty array when file does not exist', async () => {
      // Ensure file doesn't exist
      const scheduleFile = join(SCHEDULE_DIR, 'schedules.json');
      try {
        if (existsSync(scheduleFile)) {
          await unlink(scheduleFile);
        }
      } catch {
        // Ignore
      }

      const schedules = await scheduleManager.loadSchedules();
      expect(schedules).toEqual([]);
    });

    it('should load schedules from existing file', async () => {
      const schedule: Omit<Schedule, 'id' | 'createdAt'> = {
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: true,
      };

      const added = await scheduleManager.addSchedule(schedule);
      const schedules = await scheduleManager.loadSchedules();

      expect(schedules.length).toBeGreaterThan(0);
      const found = schedules.find((s) => s.id === added.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe('Test Schedule');
    });

    it('should throw error for invalid JSON', async () => {
      const scheduleFile = join(SCHEDULE_DIR, 'schedules.json');
      await mkdir(SCHEDULE_DIR, { recursive: true });
      await writeFile(scheduleFile, 'invalid json', 'utf-8');

      await expect(scheduleManager.loadSchedules()).rejects.toThrow();
    });
  });

  describe('saveSchedules()', () => {
    it('should save schedules to file', async () => {
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

      await scheduleManager.saveSchedules(schedules);

      const loaded = await scheduleManager.loadSchedules();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('Test Schedule');
    });

    it('should create directory if it does not exist', async () => {
      // Remove directory first
      try {
        const scheduleFile = join(SCHEDULE_DIR, 'schedules.json');
        if (existsSync(scheduleFile)) {
          await unlink(scheduleFile);
        }
      } catch {
        // Ignore
      }

      const schedules: Schedule[] = [];

      await scheduleManager.saveSchedules(schedules);

      const scheduleFile = join(SCHEDULE_DIR, 'schedules.json');
      expect(existsSync(scheduleFile)).toBe(true);
    });
  });

  describe('addSchedule()', () => {
    it('should add new schedule with generated ID', async () => {
      const schedule: Omit<Schedule, 'id' | 'createdAt'> = {
        name: 'New Schedule',
        cron: '0 9 * * *',
        workflowPath: './new.yaml',
        enabled: true,
      };

      const added = await scheduleManager.addSchedule(schedule);

      expect(added.id).toBeTruthy();
      expect(added.id.length).toBeGreaterThan(0);
      expect(added.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(added.name).toBe('New Schedule');
    });

    it('should add schedule to existing schedules', async () => {
      // Add first schedule
      const schedule1: Omit<Schedule, 'id' | 'createdAt'> = {
        name: 'First Schedule',
        cron: '0 8 * * *',
        workflowPath: './first.yaml',
        enabled: true,
      };
      await scheduleManager.addSchedule(schedule1);

      // Add second schedule
      const schedule2: Omit<Schedule, 'id' | 'createdAt'> = {
        name: 'Second Schedule',
        cron: '0 9 * * *',
        workflowPath: './second.yaml',
        enabled: true,
      };
      const added2 = await scheduleManager.addSchedule(schedule2);

      const schedules = await scheduleManager.loadSchedules();
      expect(schedules.length).toBeGreaterThanOrEqual(2);
      const found = schedules.find((s) => s.id === added2.id);
      expect(found?.name).toBe('Second Schedule');
    });
  });

  describe('removeSchedule()', () => {
    it('should remove schedule by ID', async () => {
      const schedule: Omit<Schedule, 'id' | 'createdAt'> = {
        name: 'To Remove',
        cron: '0 9 * * *',
        workflowPath: './remove.yaml',
        enabled: true,
      };

      const added = await scheduleManager.addSchedule(schedule);
      const schedulesBefore = await scheduleManager.loadSchedules();

      const removed = await scheduleManager.removeSchedule(added.id);

      expect(removed).toBe(true);
      const schedulesAfter = await scheduleManager.loadSchedules();
      expect(schedulesAfter.length).toBe(schedulesBefore.length - 1);
      const found = schedulesAfter.find((s) => s.id === added.id);
      expect(found).toBeUndefined();
    });

    it('should return false when schedule not found', async () => {
      const removed = await scheduleManager.removeSchedule('nonexistent-id');
      expect(removed).toBe(false);
    });
  });

  describe('updateLastRun()', () => {
    it('should update lastRun timestamp for schedule', async () => {
      const schedule: Omit<Schedule, 'id' | 'createdAt'> = {
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: true,
      };

      const added = await scheduleManager.addSchedule(schedule);

      await scheduleManager.updateLastRun(added.id);

      const updated = await scheduleManager.getSchedule(added.id);
      expect(updated?.lastRun).toBeDefined();
      expect(updated?.lastRun).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should not update when schedule not found', async () => {
      // Should not throw
      await expect(scheduleManager.updateLastRun('nonexistent-id')).resolves.not.toThrow();
    });
  });

  describe('toggleSchedule()', () => {
    it('should enable schedule', async () => {
      const schedule: Omit<Schedule, 'id' | 'createdAt'> = {
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: false,
      };

      const added = await scheduleManager.addSchedule(schedule);

      const toggled = await scheduleManager.toggleSchedule(added.id, true);

      expect(toggled).toBe(true);
      const updated = await scheduleManager.getSchedule(added.id);
      expect(updated?.enabled).toBe(true);
    });

    it('should disable schedule', async () => {
      const schedule: Omit<Schedule, 'id' | 'createdAt'> = {
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: true,
      };

      const added = await scheduleManager.addSchedule(schedule);

      const toggled = await scheduleManager.toggleSchedule(added.id, false);

      expect(toggled).toBe(true);
      const updated = await scheduleManager.getSchedule(added.id);
      expect(updated?.enabled).toBe(false);
    });

    it('should return false when schedule not found', async () => {
      const toggled = await scheduleManager.toggleSchedule('nonexistent-id', true);
      expect(toggled).toBe(false);
    });
  });

  describe('getSchedule()', () => {
    it('should return schedule by ID', async () => {
      const schedule: Omit<Schedule, 'id' | 'createdAt'> = {
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: true,
      };

      const added = await scheduleManager.addSchedule(schedule);

      const found = await scheduleManager.getSchedule(added.id);

      expect(found).toBeDefined();
      expect(found?.name).toBe('Test Schedule');
      expect(found?.id).toBe(added.id);
    });

    it('should return undefined when schedule not found', async () => {
      const found = await scheduleManager.getSchedule('nonexistent-id');
      expect(found).toBeUndefined();
    });
  });
});
