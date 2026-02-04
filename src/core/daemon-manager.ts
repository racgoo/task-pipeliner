/**
 * Daemon Manager
 *
 * Manages daemon process lifecycle using PID files.
 * Prevents duplicate daemon execution and provides status checking.
 */

import { existsSync } from 'fs';
import { mkdir, readFile, stat, unlink, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

/**
 * Directory for storing daemon PID files
 */
export const DAEMON_DIR = join(homedir(), '.pipeliner', 'daemon');
const PID_FILE = join(DAEMON_DIR, 'scheduler.pid');
const START_TIME_FILE = join(DAEMON_DIR, 'scheduler.started');

/**
 * Check if a process with the given PID is running
 *
 * Uses `process.kill(pid, 0)` which sends signal 0 (null signal).
 * Signal 0 doesn't actually kill the process - it's used to check if a process exists.
 *
 * - If process exists: returns successfully (no error)
 * - If process doesn't exist: throws an error (ESRCH on Unix, similar on Windows)
 *
 * This works on both Unix-like systems and Windows in Node.js.
 */
function isProcessRunning(pid: number): boolean {
  try {
    // Signal 0: null signal - only checks if process exists, doesn't kill it
    // Works on both Unix and Windows in Node.js
    process.kill(pid, 0);
    return true; // Process exists
  } catch {
    return false; // Process doesn't exist or error occurred
  }
}

/**
 * Get the PID of the running daemon, if any
 */
export async function getDaemonPid(): Promise<number | null> {
  try {
    if (!existsSync(PID_FILE)) {
      return null;
    }

    const content = await readFile(PID_FILE, 'utf-8');
    const pid = parseInt(content.trim(), 10);

    if (isNaN(pid)) {
      // Invalid PID file, remove it
      await unlink(PID_FILE);
      return null;
    }

    // Check if process is actually running
    if (!isProcessRunning(pid)) {
      // Process is dead, remove stale PID file
      await unlink(PID_FILE);
      return null;
    }

    return pid;
  } catch (error) {
    // If file doesn't exist or can't be read, no daemon is running
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Check if daemon is running
 */
export async function isDaemonRunning(): Promise<boolean> {
  const pid = await getDaemonPid();
  return pid !== null;
}

/**
 * Save current process PID and start time to file
 */
export async function saveDaemonPid(): Promise<void> {
  await mkdir(DAEMON_DIR, { recursive: true });
  await writeFile(PID_FILE, process.pid.toString(), 'utf-8');
  const startTime = new Date().toISOString();
  await writeFile(START_TIME_FILE, startTime, 'utf-8');
}

/**
 * Remove PID file and start time file
 */
export async function removeDaemonPid(): Promise<void> {
  try {
    if (existsSync(PID_FILE)) {
      await unlink(PID_FILE);
    }
    if (existsSync(START_TIME_FILE)) {
      await unlink(START_TIME_FILE);
    }
  } catch {
    // Ignore errors when removing files
    // It's okay if they don't exist
  }
}

/**
 * Get daemon start time
 * If start time file doesn't exist, use PID file's modification time as fallback
 */
export async function getDaemonStartTime(): Promise<string | null> {
  try {
    // First, try to read the start time file
    if (existsSync(START_TIME_FILE)) {
      const content = await readFile(START_TIME_FILE, 'utf-8');
      const startTime = content.trim();
      if (startTime) {
        return startTime;
      }
    }

    // Fallback: use PID file's modification time if it exists
    // This handles cases where daemon was started before we added start time tracking
    if (existsSync(PID_FILE)) {
      const stats = await stat(PID_FILE);
      return new Date(stats.mtime).toISOString();
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get daemon status information
 */
export async function getDaemonStatus(): Promise<{
  running: boolean;
  pid: number | null;
  startTime: string | null;
}> {
  const pid = await getDaemonPid();
  const startTime = pid ? await getDaemonStartTime() : null;
  return {
    running: pid !== null,
    pid,
    startTime,
  };
}
