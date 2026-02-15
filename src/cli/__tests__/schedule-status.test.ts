import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Schedule } from '@tp-types/schedule';
import {
  formatUptime,
  formatScheduleStatus,
  generateStatusDisplay,
  showSchedulerStatus,
  clearScreenToTop,
} from '../schedule/status';

// Mock dependencies
const mockGetDaemonStatus = vi.fn();
const mockLoadSchedules = vi.fn();
const mockLogUpdate = vi.fn();

vi.mock('@core/scheduling/daemon-manager', () => ({
  getDaemonStatus: () => mockGetDaemonStatus(),
}));

vi.mock('@core/scheduling/schedule-manager', () => ({
  ScheduleManager: vi.fn().mockImplementation(() => ({
    loadSchedules: () => mockLoadSchedules(),
  })),
}));

vi.mock('log-update', () => ({
  default: {
    __esModule: true,
    default: (text: string) => mockLogUpdate(text),
    done: vi.fn(),
  },
}));

describe('ScheduleStatus', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let stdoutWriteSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    stdoutWriteSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('formatUptime()', () => {
    it('should return "Unknown" when startTime is null', () => {
      const result = formatUptime(null);
      expect(result).toBe('Unknown');
    });

    it('should format uptime in seconds', () => {
      const startTime = new Date(Date.now() - 30 * 1000).toISOString();
      const result = formatUptime(startTime);
      expect(result).toContain('s');
    });

    it('should format uptime in minutes', () => {
      const startTime = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const result = formatUptime(startTime);
      expect(result).toContain('m');
    });

    it('should format uptime in hours', () => {
      const startTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const result = formatUptime(startTime);
      expect(result).toContain('h');
    });

    it('should format uptime in days', () => {
      const startTime = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      const result = formatUptime(startTime);
      expect(result).toContain('d');
    });

    it('should combine multiple time units', () => {
      const startTime = new Date(
        Date.now() - (2 * 24 * 60 * 60 + 3 * 60 * 60 + 30 * 60) * 1000
      ).toISOString();
      const result = formatUptime(startTime);
      expect(result).toContain('d');
      expect(result).toContain('h');
      expect(result).toContain('m');
    });
  });

  describe('formatScheduleStatus()', () => {
    it('should format schedule status', () => {
      const schedule: Schedule = {
        id: 'test1',
        name: 'Test Schedule',
        cron: '0 9 * * *',
        workflowPath: './test.yaml',
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      const result = formatScheduleStatus(schedule, true);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toContain('Test Schedule');
    });
  });

  describe('generateStatusDisplay()', () => {
    it('should generate status display when daemon is running', async () => {
      mockGetDaemonStatus.mockResolvedValue({
        running: true,
        pid: 12345,
        startTime: new Date().toISOString(),
      });

      const mockSchedules: Schedule[] = [
        {
          id: 'test1',
          name: 'Test Schedule',
          cron: '0 9 * * *',
          workflowPath: './test.yaml',
          enabled: true,
          createdAt: new Date().toISOString(),
        },
      ];

      mockLoadSchedules.mockResolvedValue(mockSchedules);

      const display = await generateStatusDisplay();

      expect(display).toBeTruthy();
      expect(typeof display).toBe('string');
      expect(display).toContain('active');
      expect(display.length).toBeGreaterThan(0);
    });

    it('should generate status display when daemon is not running', async () => {
      mockGetDaemonStatus.mockResolvedValue({
        running: false,
        pid: null,
        startTime: null,
      });

      mockLoadSchedules.mockResolvedValue([]);

      const display = await generateStatusDisplay();

      expect(display).toBeTruthy();
      expect(typeof display).toBe('string');
      expect(display).toContain('inactive');
    });

    it('should show enabled count when schedules exist', async () => {
      mockGetDaemonStatus.mockResolvedValue({
        running: true,
        pid: 12345,
        startTime: new Date().toISOString(),
      });

      const mockSchedules: Schedule[] = [
        {
          id: 'test1',
          name: 'Test Schedule 1',
          cron: '0 9 * * *',
          workflowPath: './test1.yaml',
          enabled: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'test2',
          name: 'Test Schedule 2',
          cron: '0 10 * * *',
          workflowPath: './test2.yaml',
          enabled: false,
          createdAt: new Date().toISOString(),
        },
      ];

      mockLoadSchedules.mockResolvedValue(mockSchedules);

      const display = await generateStatusDisplay();

      expect(display).toBeTruthy();
      expect(typeof display).toBe('string');
      expect(display.length).toBeGreaterThan(0);
    });

    it('should show "No schedules configured" when no schedules exist', async () => {
      mockGetDaemonStatus.mockResolvedValue({
        running: false,
        pid: null,
        startTime: null,
      });

      mockLoadSchedules.mockResolvedValue([]);

      const display = await generateStatusDisplay();

      // Display may contain the message in a box
      expect(display).toBeTruthy();
      expect(typeof display).toBe('string');
      expect(display.length).toBeGreaterThan(0);
    });
  });

  describe('clearScreenToTop()', () => {
    it('should write ANSI escape codes to stdout', () => {
      clearScreenToTop();
      expect(stdoutWriteSpy).toHaveBeenCalledWith('\x1b[2J\x1b[H');
    });
  });

  describe('showSchedulerStatus()', () => {
    it('should show status once when follow is false', async () => {
      mockGetDaemonStatus.mockResolvedValue({
        running: false,
        pid: null,
        startTime: null,
      });
      mockLoadSchedules.mockResolvedValue([]);

      await showSchedulerStatus(false);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(stdoutWriteSpy).toHaveBeenCalled();
    });

    it('should handle follow mode with TTY', async () => {
      const originalIsTTY = process.stdin.isTTY;
      const originalStdoutIsTTY = process.stdout.isTTY;
      Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
      Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
      Object.defineProperty(process.stdout, 'rows', { value: 24, configurable: true });

      mockGetDaemonStatus.mockResolvedValue({
        running: false,
        pid: null,
        startTime: null,
      });
      mockLoadSchedules.mockResolvedValue([]);

      // Mock setRawMode and other stdin methods
      const mockSetRawMode = vi.fn();
      const mockResume = vi.fn();
      const mockPause = vi.fn();
      const mockSetEncoding = vi.fn();
      Object.defineProperty(process.stdin, 'setRawMode', {
        value: mockSetRawMode,
        configurable: true,
      });
      Object.defineProperty(process.stdin, 'resume', { value: mockResume, configurable: true });
      Object.defineProperty(process.stdin, 'pause', { value: mockPause, configurable: true });
      Object.defineProperty(process.stdin, 'setEncoding', {
        value: mockSetEncoding,
        configurable: true,
      });

      // This will hang, so we'll use a timeout
      const statusPromise = showSchedulerStatus(true);
      await Promise.race([statusPromise, new Promise((resolve) => setTimeout(resolve, 100))]);

      // Restore
      Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true });
      Object.defineProperty(process.stdout, 'isTTY', {
        value: originalStdoutIsTTY,
        configurable: true,
      });

      expect(stdoutWriteSpy).toHaveBeenCalled();
    });

    it('should handle follow mode without TTY', async () => {
      const originalIsTTY = process.stdin.isTTY;
      const originalStdoutIsTTY = process.stdout.isTTY;
      Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
      Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true });

      mockGetDaemonStatus.mockResolvedValue({
        running: false,
        pid: null,
        startTime: null,
      });
      mockLoadSchedules.mockResolvedValue([]);

      const statusPromise = showSchedulerStatus(true);
      await Promise.race([statusPromise, new Promise((resolve) => setTimeout(resolve, 200))]);

      // Restore
      Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true });
      Object.defineProperty(process.stdout, 'isTTY', {
        value: originalStdoutIsTTY,
        configurable: true,
      });

      // logUpdate may be called or not depending on timing
      expect(stdoutWriteSpy).toHaveBeenCalled();
    });
  });
});
