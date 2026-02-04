import { mkdir, readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import { Schedule, ScheduleConfig } from '../types/schedule';

/**
 * Directory for storing schedule configurations
 */
export const SCHEDULE_DIR = join(homedir(), '.pipeliner', 'schedules');
const SCHEDULE_FILE = join(SCHEDULE_DIR, 'schedules.json');

/**
 * ScheduleManager
 *
 * Manages workflow schedules - adding, removing, listing, and updating schedules.
 */
export class ScheduleManager {
  /**
   * Load all schedules from disk
   */
  async loadSchedules(): Promise<Schedule[]> {
    try {
      const content = await readFile(SCHEDULE_FILE, 'utf-8');
      const config: ScheduleConfig = JSON.parse(content);
      return config.schedules || [];
    } catch (error) {
      // File doesn't exist or is invalid
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Save schedules to disk
   */
  async saveSchedules(schedules: Schedule[]): Promise<void> {
    await mkdir(SCHEDULE_DIR, { recursive: true });
    const config: ScheduleConfig = { schedules };
    await writeFile(SCHEDULE_FILE, JSON.stringify(config, null, 2), 'utf-8');
  }

  /**
   * Add a new schedule
   */
  async addSchedule(schedule: Omit<Schedule, 'id' | 'createdAt'>): Promise<Schedule> {
    const schedules = await this.loadSchedules();

    // Generate unique ID
    const id = Math.random().toString(36).slice(2, 10);
    const createdAt = new Date().toISOString();

    const newSchedule: Schedule = {
      id,
      createdAt,
      ...schedule,
    };

    schedules.push(newSchedule);
    await this.saveSchedules(schedules);

    return newSchedule;
  }

  /**
   * Remove a schedule by ID
   */
  async removeSchedule(id: string): Promise<boolean> {
    const schedules = await this.loadSchedules();
    const initialLength = schedules.length;
    const filtered = schedules.filter((s) => s.id !== id);

    if (filtered.length === initialLength) {
      return false; // Schedule not found
    }

    await this.saveSchedules(filtered);
    return true;
  }

  /**
   * Update schedule's last run time
   */
  async updateLastRun(id: string): Promise<void> {
    const schedules = await this.loadSchedules();
    const schedule = schedules.find((s) => s.id === id);

    if (schedule) {
      schedule.lastRun = new Date().toISOString();
      await this.saveSchedules(schedules);
    }
  }

  /**
   * Enable or disable a schedule
   */
  async toggleSchedule(id: string, enabled: boolean): Promise<boolean> {
    const schedules = await this.loadSchedules();
    const schedule = schedules.find((s) => s.id === id);

    if (!schedule) {
      return false;
    }

    schedule.enabled = enabled;
    await this.saveSchedules(schedules);
    return true;
  }

  /**
   * Get a single schedule by ID
   */
  async getSchedule(id: string): Promise<Schedule | undefined> {
    const schedules = await this.loadSchedules();
    return schedules.find((s) => s.id === id);
  }
}
