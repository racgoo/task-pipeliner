import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createScheduleCommand } from '../schedule';

// Mock schedule-actions
vi.mock('../schedule-actions', () => ({
  addSchedules: vi.fn(),
  listSchedules: vi.fn(),
  removeAllSchedules: vi.fn(),
  removeSchedule: vi.fn(),
  startScheduler: vi.fn(),
  stopScheduler: vi.fn(),
  toggleSchedule: vi.fn(),
}));

// Mock schedule-status
vi.mock('../schedule-status', () => ({
  showSchedulerStatus: vi.fn(),
}));

describe('ScheduleCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createScheduleCommand()', () => {
    it('should create a schedule command', () => {
      const cmd = createScheduleCommand();
      expect(cmd).toBeDefined();
      expect(cmd.name()).toBe('schedule');
    });

    it('should have correct description', () => {
      const cmd = createScheduleCommand();
      expect(cmd.description()).toBe('Manage workflow schedules');
    });

    it('should have add subcommand', () => {
      const cmd = createScheduleCommand();
      const addCmd = cmd.commands.find((c) => c.name() === 'add');
      expect(addCmd).toBeDefined();
      expect(addCmd?.description()).toContain('Add schedules');
    });

    it('should have remove subcommand', () => {
      const cmd = createScheduleCommand();
      const removeCmd = cmd.commands.find((c) => c.name() === 'remove');
      expect(removeCmd).toBeDefined();
      expect(removeCmd?.description()).toContain('Remove');
    });

    it('should have remove alias "rm"', () => {
      const cmd = createScheduleCommand();
      const removeCmd = cmd.commands.find((c) => c.name() === 'remove');
      expect(removeCmd?.aliases()).toContain('rm');
    });

    it('should have remove-all subcommand', () => {
      const cmd = createScheduleCommand();
      const removeAllCmd = cmd.commands.find((c) => c.name() === 'remove-all');
      expect(removeAllCmd).toBeDefined();
      expect(removeAllCmd?.description()).toContain('Remove all');
    });

    it('should have list subcommand', () => {
      const cmd = createScheduleCommand();
      const listCmd = cmd.commands.find((c) => c.name() === 'list');
      expect(listCmd).toBeDefined();
      expect(listCmd?.description()).toContain('List');
    });

    it('should have list alias "ls"', () => {
      const cmd = createScheduleCommand();
      const listCmd = cmd.commands.find((c) => c.name() === 'list');
      expect(listCmd?.aliases()).toContain('ls');
    });

    it('should have start subcommand', () => {
      const cmd = createScheduleCommand();
      const startCmd = cmd.commands.find((c) => c.name() === 'start');
      expect(startCmd).toBeDefined();
      expect(startCmd?.description()).toContain('Start');
    });

    it('should have start subcommand with daemon option', () => {
      const cmd = createScheduleCommand();
      const startCmd = cmd.commands.find((c) => c.name() === 'start');
      const daemonOption = startCmd?.options.find((o) => o.long === '--daemon');
      expect(daemonOption).toBeDefined();
    });

    it('should have stop subcommand', () => {
      const cmd = createScheduleCommand();
      const stopCmd = cmd.commands.find((c) => c.name() === 'stop');
      expect(stopCmd).toBeDefined();
      expect(stopCmd?.description()).toContain('Stop');
    });

    it('should have status subcommand', () => {
      const cmd = createScheduleCommand();
      const statusCmd = cmd.commands.find((c) => c.name() === 'status');
      expect(statusCmd).toBeDefined();
      expect(statusCmd?.description()).toContain('View daemon');
    });

    it('should have status subcommand with no-follow option', () => {
      const cmd = createScheduleCommand();
      const statusCmd = cmd.commands.find((c) => c.name() === 'status');
      const noFollowOption = statusCmd?.options.find((o) => o.long === '--no-follow');
      expect(noFollowOption).toBeDefined();
    });

    it('should have toggle subcommand', () => {
      const cmd = createScheduleCommand();
      const toggleCmd = cmd.commands.find((c) => c.name() === 'toggle');
      expect(toggleCmd).toBeDefined();
      expect(toggleCmd?.description()).toContain('Enable or disable');
    });
  });
});

