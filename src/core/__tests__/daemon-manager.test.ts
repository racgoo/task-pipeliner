import { existsSync } from 'fs';
import { mkdir, readFile, rm, stat, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  DAEMON_DIR,
  getDaemonPid,
  getDaemonStartTime,
  getDaemonStatus,
  getDaemonErrorLogPath,
  isDaemonRunning,
  readDaemonErrorLog,
  removeDaemonPid,
  saveDaemonPid,
  writeDaemonError,
} from '../scheduling/daemon-manager';

// Mock process.kill for isProcessRunning
const originalKill = process.kill;
let mockKill: ReturnType<typeof vi.fn>;

describe('DaemonManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock process.kill
    mockKill = vi.fn().mockReturnValue(undefined);
    process.kill = mockKill as any;
  });

  afterEach(async () => {
    // Restore original process.kill
    process.kill = originalKill;

    // Clean up any test files
    try {
      await removeDaemonPid();
      const logPath = getDaemonErrorLogPath();
      if (existsSync(logPath)) {
        await unlink(logPath);
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('getDaemonPid()', () => {
    it('should return null when PID file does not exist', async () => {
      // Ensure PID file doesn't exist
      await removeDaemonPid();
      const pid = await getDaemonPid();
      expect(pid).toBeNull();
    });

    it('should return PID when file exists and process is running', async () => {
      // Save PID file
      await saveDaemonPid();
      mockKill.mockReturnValue(undefined); // Process exists

      const pid = await getDaemonPid();
      expect(pid).toBe(process.pid);

      // Clean up
      await removeDaemonPid();
    });

    it('should return null and remove file when PID is invalid', async () => {
      // Create invalid PID file
      const pidFile = join(DAEMON_DIR, 'scheduler.pid');
      await mkdir(DAEMON_DIR, { recursive: true });
      await writeFile(pidFile, 'invalid', 'utf-8');

      const pid = await getDaemonPid();
      expect(pid).toBeNull();
      // File should be removed
      expect(existsSync(pidFile)).toBe(false);
    });

    it('should return null and remove file when process is not running', async () => {
      // Create PID file with non-existent PID
      const pidFile = join(DAEMON_DIR, 'scheduler.pid');
      await mkdir(DAEMON_DIR, { recursive: true });
      await writeFile(pidFile, '99999', 'utf-8');
      mockKill.mockImplementation(() => {
        throw new Error('ESRCH'); // Process doesn't exist
      });

      const pid = await getDaemonPid();
      expect(pid).toBeNull();
      // File should be removed
      expect(existsSync(pidFile)).toBe(false);
    });
  });

  describe('isDaemonRunning()', () => {
    it('should return false when no PID file exists', async () => {
      await removeDaemonPid();
      const running = await isDaemonRunning();
      expect(running).toBe(false);
    });

    it('should return true when PID file exists and process is running', async () => {
      await saveDaemonPid();
      mockKill.mockReturnValue(undefined); // Process exists

      const running = await isDaemonRunning();
      expect(running).toBe(true);

      // Clean up
      await removeDaemonPid();
    });
  });

  describe('saveDaemonPid()', () => {
    it('should save PID and start time to files', async () => {
      await saveDaemonPid();

      const pidFile = join(DAEMON_DIR, 'scheduler.pid');
      const startTimeFile = join(DAEMON_DIR, 'scheduler.started');

      expect(existsSync(pidFile)).toBe(true);
      expect(existsSync(startTimeFile)).toBe(true);

      const pidContent = await readFile(pidFile, 'utf-8');
      const startTimeContent = await readFile(startTimeFile, 'utf-8');

      expect(pidContent.trim()).toBe(process.pid.toString());
      expect(startTimeContent.trim()).toMatch(/^\d{4}-\d{2}-\d{2}T/);

      // Clean up
      await removeDaemonPid();
    });
  });

  describe('removeDaemonPid()', () => {
    it('should remove PID and start time files', async () => {
      // First create files
      await saveDaemonPid();

      const pidFile = join(DAEMON_DIR, 'scheduler.pid');
      const startTimeFile = join(DAEMON_DIR, 'scheduler.started');

      expect(existsSync(pidFile)).toBe(true);
      expect(existsSync(startTimeFile)).toBe(true);

      await removeDaemonPid();

      expect(existsSync(pidFile)).toBe(false);
      expect(existsSync(startTimeFile)).toBe(false);
    });

    it('should not throw when files do not exist', async () => {
      // Ensure files don't exist
      await removeDaemonPid();

      // Should not throw
      await expect(removeDaemonPid()).resolves.not.toThrow();
    });
  });

  describe('getDaemonStartTime()', () => {
    it('should return start time from file when it exists', async () => {
      await saveDaemonPid();

      const startTime = await getDaemonStartTime();
      expect(startTime).toBeTruthy();
      expect(startTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);

      // Clean up
      await removeDaemonPid();
    });

    it('should return null when start time file does not exist', async () => {
      await removeDaemonPid();

      const startTime = await getDaemonStartTime();
      expect(startTime).toBeNull();
    });

    it('should use PID file modification time as fallback', async () => {
      // Create only PID file (no start time file)
      const pidFile = join(DAEMON_DIR, 'scheduler.pid');
      await mkdir(DAEMON_DIR, { recursive: true });
      await writeFile(pidFile, process.pid.toString(), 'utf-8');
      mockKill.mockReturnValue(undefined);

      const startTime = await getDaemonStartTime();
      expect(startTime).toBeTruthy();
      expect(startTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);

      // Clean up
      await removeDaemonPid();
    });
  });

  describe('getDaemonStatus()', () => {
    it('should return status with running=false when no PID', async () => {
      await removeDaemonPid();

      const status = await getDaemonStatus();
      expect(status.running).toBe(false);
      expect(status.pid).toBeNull();
      expect(status.startTime).toBeNull();
    });

    it('should return status with running=true when PID exists', async () => {
      await saveDaemonPid();
      mockKill.mockReturnValue(undefined);

      const status = await getDaemonStatus();
      expect(status.running).toBe(true);
      expect(status.pid).toBe(process.pid);
      expect(status.startTime).toBeTruthy();

      // Clean up
      await removeDaemonPid();
    });
  });

  describe('writeDaemonError() and readDaemonErrorLog()', () => {
    it('should write error to log file', async () => {
      const error = new Error('Test error');
      await writeDaemonError(error);

      const logPath = getDaemonErrorLogPath();
      expect(existsSync(logPath)).toBe(true);

      const content = await readFile(logPath, 'utf-8');
      expect(content).toContain('Test error');
    });

    it('should read error log when it exists', async () => {
      const error = new Error('Test error message');
      await writeDaemonError(error);

      const content = await readDaemonErrorLog();
      expect(content).toBeTruthy();
      expect(content).toContain('Test error message');
    });

    it('should return null when error log does not exist', async () => {
      // Remove error log if it exists
      const logPath = getDaemonErrorLogPath();
      if (existsSync(logPath)) {
        await unlink(logPath);
      }

      const content = await readDaemonErrorLog();
      expect(content).toBeNull();
    });
  });

  describe('getDaemonErrorLogPath()', () => {
    it('should return error log file path', () => {
      const path = getDaemonErrorLogPath();
      expect(path).toContain('error.log');
      expect(path).toContain('.pipeliner');
      expect(path).toContain('daemon');
    });
  });
});
