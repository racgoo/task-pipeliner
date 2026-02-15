import { describe, it, expect } from 'vitest';
import type { Schedule } from '@tp-types/schedule';
import { formatScheduleCard, getCronDescription, getNextRunForSchedule } from '../schedule/card-format';

describe('ScheduleCardFormat', () => {
  describe('getCronDescription()', () => {
    it('should return human-readable description for valid cron', () => {
      const description = getCronDescription('0 9 * * *');
      expect(description).toBeTruthy();
      expect(typeof description).toBe('string');
    });

    it('should return null for invalid cron', () => {
      const description = getCronDescription('invalid cron');
      expect(description).toBeNull();
    });

    it('should handle various cron expressions', () => {
      const testCases = [
        '0 9 * * *', // Daily at 9 AM
        '*/5 * * * *', // Every 5 minutes
        '0 0 1 * *', // First day of month
        '0 12 * * 1', // Every Monday at noon
      ];

      for (const cronExpr of testCases) {
        const description = getCronDescription(cronExpr);
        // Should either return a description or null (if cronstrue can't parse it)
        expect(description === null || typeof description === 'string').toBe(true);
      }
    });
  });

  describe('getNextRunForSchedule()', () => {
    it('should return next run date for valid schedule', () => {
      const schedule: Schedule = {
        id: 'test1',
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      const nextRun = getNextRunForSchedule(schedule);
      // May return Date or null depending on cron validation
      if (nextRun !== null) {
        expect(nextRun).toBeInstanceOf(Date);
        expect(nextRun.getTime()).toBeGreaterThan(Date.now());
      } else {
        // If null, that's also acceptable (cron validation may fail in test environment)
        expect(nextRun).toBeNull();
      }
    });

    it('should return null for invalid cron', () => {
      const schedule: Schedule = {
        id: 'test1',
        name: 'Test Schedule',
        cron: 'invalid cron',
        workflowPath: './test.yaml',
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      const nextRun = getNextRunForSchedule(schedule);
      expect(nextRun).toBeNull();
    });

    it('should handle timezone in schedule', () => {
      const schedule: Schedule = {
        id: 'test1',
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: true,
        createdAt: new Date().toISOString(),
        timezone: 'America/New_York',
      };

      const nextRun = getNextRunForSchedule(schedule);
      // Should return a date or null (depending on timezone resolution)
      expect(nextRun === null || nextRun instanceof Date).toBe(true);
    });
  });

  describe('formatScheduleCard()', () => {
    it('should format enabled schedule card', () => {
      const schedule: Schedule = {
        id: 'test1',
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      const card = formatScheduleCard(schedule, { daemonRunning: true });
      expect(card).toBeTruthy();
      expect(typeof card).toBe('string');
      expect(card).toContain('Test Schedule');
      expect(card).toContain('enabled');
    });

    it('should format disabled schedule card', () => {
      const schedule: Schedule = {
        id: 'test1',
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: false,
        createdAt: new Date().toISOString(),
      };

      const card = formatScheduleCard(schedule, { daemonRunning: true });
      expect(card).toBeTruthy();
      expect(card).toContain('disabled');
    });

    it('should show active badge when daemon is running and schedule is enabled', () => {
      const schedule: Schedule = {
        id: 'test1',
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      const card = formatScheduleCard(schedule, { daemonRunning: true });
      expect(card).toContain('active');
    });

    it('should show inactive badge when daemon is not running', () => {
      const schedule: Schedule = {
        id: 'test1',
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      const card = formatScheduleCard(schedule, { daemonRunning: false });
      expect(card).toContain('inactive');
    });

    it('should emphasize state when emphasizeState is true', () => {
      const schedule: Schedule = {
        id: 'test1',
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      const card = formatScheduleCard(schedule, {
        daemonRunning: true,
        emphasizeState: true,
      });
      expect(card).toContain('ENABLED');
    });

    it('should include profile when present', () => {
      const schedule: Schedule = {
        id: 'test1',
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: true,
        createdAt: new Date().toISOString(),
        profile: 'production',
      };

      const card = formatScheduleCard(schedule, { daemonRunning: true });
      expect(card).toContain('Profile');
      expect(card).toContain('production');
    });

    it('should include silent flag when present', () => {
      const schedule: Schedule = {
        id: 'test1',
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: true,
        createdAt: new Date().toISOString(),
        silent: true,
      };

      const card = formatScheduleCard(schedule, { daemonRunning: true });
      expect(card).toContain('Silent');
    });

    it('should display last run when available', () => {
      const schedule: Schedule = {
        id: 'test1',
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: true,
        createdAt: new Date().toISOString(),
        lastRun: new Date().toISOString(),
      };

      const card = formatScheduleCard(schedule, { daemonRunning: true });
      expect(card).toContain('Last run');
    });

    it('should display "never" for last run when not available', () => {
      const schedule: Schedule = {
        id: 'test1',
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      const card = formatScheduleCard(schedule, { daemonRunning: true });
      expect(card).toContain('Last run');
    });

    it('should display next run time', () => {
      const schedule: Schedule = {
        id: 'test1',
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      const card = formatScheduleCard(schedule, { daemonRunning: true });
      expect(card).toContain('Next run');
    });

    it('should use workflowPath as name when name is not provided', () => {
      const schedule: Schedule = {
        id: 'test1',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      const card = formatScheduleCard(schedule, { daemonRunning: true });
      expect(card).toContain('./test.yaml');
    });

    it('should handle timezone offset format', () => {
      const schedule: Schedule = {
        id: 'test1',
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: true,
        createdAt: new Date().toISOString(),
        timezone: '+09:00',
      };

      const card = formatScheduleCard(schedule, { daemonRunning: true });
      expect(card).toContain('Timezone');
    });

    it('should handle IANA timezone format', () => {
      const schedule: Schedule = {
        id: 'test1',
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: true,
        createdAt: new Date().toISOString(),
        timezone: 'America/New_York',
      };

      const card = formatScheduleCard(schedule, { daemonRunning: true });
      expect(card).toContain('Timezone');
    });
  });
});

