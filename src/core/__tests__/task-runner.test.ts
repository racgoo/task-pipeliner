import { spawn } from 'child_process';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskRunner, type TaskRunResult } from '../task-runner';

// Mock child_process.spawn
vi.mock('child_process', () => {
  const actual = vi.importActual<typeof import('child_process')>('child_process');
  return {
    ...actual,
    spawn: vi.fn(),
  };
});

// Mock UI functions
vi.mock('../../cli/ui', () => ({
  createStepHeaderBox: vi.fn((content, lineNumber?, fileName?, options?) => {
    return `[HEADER] ${content}`;
  }),
  createStepFooterMessage: vi.fn((success, _isNested, duration) =>
    success ? `✓ Completed (${duration}ms)` : `✗ Failed (${duration}ms)`
  ),
  createErrorBox: vi.fn((error) => `[ERROR] ${error}`),
  formatNestedLine: vi.fn((line, isNested) => (isNested ? `  │ ${line}` : `│ ${line}`)),
}));

describe('TaskRunner', () => {
  let taskRunner: TaskRunner;
  let tempDir: string;
  let mockSpawn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    taskRunner = new TaskRunner();
    vi.clearAllMocks();
    mockSpawn = spawn as ReturnType<typeof vi.fn>;
  });

  afterEach(async () => {
    if (tempDir) {
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('run() - mode selection', () => {
    it('should use buffered mode when bufferOutput is true', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const promise = taskRunner.run('echo "test"', undefined, undefined, undefined, true);

      // Simulate process completion immediately
      await new Promise((resolve) => setImmediate(resolve));
      mockChild.stdout?.emit('data', Buffer.from('test\n'));
      mockChild.emit('close', 0);
      await new Promise((resolve) => setImmediate(resolve));

      const result = await promise;
      expect(result).toHaveProperty('stdout');
      expect(result).toHaveProperty('stderr');
      expect(result).toHaveProperty('success');
    });

    it('should use realtime mode when bufferOutput is false', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const promise = taskRunner.run('echo "test"', undefined, 'Test Step', undefined, false);

      // Simulate process completion immediately
      await new Promise((resolve) => setImmediate(resolve));
      mockChild.stdout?.emit('data', Buffer.from('test\n'));
      mockChild.emit('close', 0);
      await new Promise((resolve) => setImmediate(resolve));

      const result = await promise;
      expect(typeof result).toBe('boolean');
    });
  });

  describe('spawnWithShell() - shell configuration', () => {
    it('should use custom shell when provided', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const customShell = ['bash', '-lc'];
      const promise = taskRunner.run(
        'echo "test"',
        undefined,
        undefined,
        undefined,
        true,
        false,
        undefined,
        undefined,
        undefined,
        undefined,
        customShell
      );

      await new Promise((resolve) => setImmediate(resolve));
      mockChild.emit('close', 0);
      await promise;

      expect(mockSpawn).toHaveBeenCalledWith(
        'bash',
        ['-lc', 'echo "test"'],
        expect.objectContaining({
          stdio: ['inherit', 'pipe', 'pipe'],
        })
      );
    });

    it('should use default shell when not provided (Unix)', async () => {
      const originalShell = process.env.SHELL;
      process.env.SHELL = '/bin/zsh';

      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const promise = taskRunner.run('echo "test"', undefined, undefined, undefined, true);
      await new Promise((resolve) => setImmediate(resolve));
      mockChild.emit('close', 0);
      await promise;

      expect(mockSpawn).toHaveBeenCalledWith(
        '/bin/zsh',
        ['-c', 'echo "test"'],
        expect.objectContaining({
          stdio: ['inherit', 'pipe', 'pipe'],
        })
      );

      process.env.SHELL = originalShell;
    });

    it('should use working directory when provided', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'task-runner-test-'));
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const promise = taskRunner.run(
        'echo "test"',
        undefined,
        undefined,
        undefined,
        true,
        false,
        undefined,
        undefined,
        tempDir
      );
      await new Promise((resolve) => setImmediate(resolve));
      mockChild.emit('close', 0);
      await promise;

      expect(mockSpawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({
          cwd: tempDir,
        })
      );
    });
  });

  describe('runBuffered() - buffered execution', () => {
    it('should collect stdout lines', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const promise = taskRunner.run('echo "line1\\nline2"', undefined, undefined, undefined, true);

      await new Promise((resolve) => setImmediate(resolve));
      mockChild.stdout?.emit('data', Buffer.from('line1\nline2\n'));
      mockChild.emit('close', 0);
      await new Promise((resolve) => setImmediate(resolve));

      const result = (await promise) as TaskRunResult;
      expect(result.stdout).toEqual(['line1', 'line2']);
      expect(result.success).toBe(true);
    });

    it('should collect stderr lines', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const promise = taskRunner.run('echo "error" >&2', undefined, undefined, undefined, true);

      await new Promise((resolve) => setImmediate(resolve));
      mockChild.stderr?.emit('data', Buffer.from('error\n'));
      mockChild.emit('close', 0);
      await new Promise((resolve) => setImmediate(resolve));

      const result = (await promise) as TaskRunResult;
      expect(result.stderr).toContain('error');
    });

    it('should handle incomplete lines across chunks', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const promise = taskRunner.run('echo "test"', undefined, undefined, undefined, true);

      await new Promise((resolve) => setImmediate(resolve));
      mockChild.stdout?.emit('data', Buffer.from('line1\nline2'));
      await new Promise((resolve) => setImmediate(resolve));
      mockChild.stdout?.emit('data', Buffer.from('\nline3\n'));
      mockChild.emit('close', 0);
      await new Promise((resolve) => setImmediate(resolve));

      const result = (await promise) as TaskRunResult;
      expect(result.stdout).toEqual(['line1', 'line2', 'line3']);
    });

    it('should handle timeout', async () => {
      vi.useFakeTimers();
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const promise = taskRunner.run(
        'sleep 10',
        undefined,
        undefined,
        undefined,
        true,
        false,
        undefined,
        undefined,
        undefined,
        1
      );

      await vi.runAllTimersAsync();

      const result = (await promise) as TaskRunResult;
      expect(result.success).toBe(false);
      expect(result.stderr.some((line) => line.includes('timed out') || line.includes('Command timed out'))).toBe(true);
      expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');

      vi.useRealTimers();
    });

    it('should handle process errors', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const promise = taskRunner.run('invalid-command', undefined, undefined, undefined, true);

      await new Promise((resolve) => setImmediate(resolve));
      mockChild.emit('error', new Error('Command not found'));
      await new Promise((resolve) => setImmediate(resolve));

      const result = (await promise) as TaskRunResult;
      expect(result.success).toBe(false);
      expect(result.stderr.some((line) => line.includes('Error:') || line.includes('Command not found'))).toBe(true);
    });

    it('should handle non-zero exit codes', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const promise = taskRunner.run('exit 1', undefined, undefined, undefined, true);

      await new Promise((resolve) => setImmediate(resolve));
      mockChild.emit('close', 1);
      await new Promise((resolve) => setImmediate(resolve));

      const result = (await promise) as TaskRunResult;
      expect(result.success).toBe(false);
    });
  });

  describe('runRealtime() - realtime execution', () => {
    it('should display output immediately', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);
      const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

      const promise = taskRunner.run('echo "test"', undefined, 'Test Step', undefined, false);

      await new Promise((resolve) => setImmediate(resolve));
      mockChild.stdout?.emit('data', Buffer.from('test\n'));
      mockChild.emit('close', 0);
      await new Promise((resolve) => setImmediate(resolve));

      await promise;

      expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining('│ test\n'));
      writeSpy.mockRestore();
    });

    it('should use green border for steps with conditions', async () => {
      const { createStepHeaderBox } = await import('../../cli/ui');
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const promise = taskRunner.run('echo "test"', undefined, 'Test Step', undefined, false, true);

      // Wait for event listeners to be set up
      await new Promise((resolve) => setImmediate(resolve));
      
      // Trigger close event by calling the stored callback
      const closeCall = mockChild.on.mock.calls.find((call) => call[0] === 'close');
      if (closeCall && closeCall[1]) {
        closeCall[1](0);
      }
      
      await new Promise((resolve) => setImmediate(resolve));
      await promise;

      expect(createStepHeaderBox).toHaveBeenCalledWith(
        'Test Step',
        undefined,
        undefined,
        expect.objectContaining({ borderColor: 'green' })
      );
    });

    it('should use cyan border for steps without conditions', async () => {
      const { createStepHeaderBox } = await import('../../cli/ui');
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const promise = taskRunner.run(
        'echo "test"',
        undefined,
        'Test Step',
        undefined,
        false,
        false
      );

      // Wait for event listeners to be set up
      await new Promise((resolve) => setImmediate(resolve));
      
      // Trigger close event by calling the stored callback
      const closeCall = mockChild.on.mock.calls.find((call) => call[0] === 'close');
      if (closeCall && closeCall[1]) {
        closeCall[1](0);
      }
      
      await new Promise((resolve) => setImmediate(resolve));
      await promise;

      expect(createStepHeaderBox).toHaveBeenCalledWith(
        'Test Step',
        undefined,
        undefined,
        expect.objectContaining({ borderColor: 'cyan' })
      );
    });

    it('should handle timeout in realtime mode', async () => {
      vi.useFakeTimers();
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);
      const { createErrorBox } = await import('../../cli/ui');

      const promise = taskRunner.run(
        'sleep 10',
        undefined,
        'Test Step',
        undefined,
        false,
        false,
        undefined,
        undefined,
        undefined,
        1
      );

      // Advance timers to trigger timeout (1 second)
      vi.advanceTimersByTime(1000);
      
      // Wait for timeout handler to execute
      await vi.runOnlyPendingTimersAsync();

      // The promise should resolve after timeout
      const result = await Promise.race([
        promise,
        new Promise((resolve) => setTimeout(() => resolve('timeout'), 100)),
      ]);

      expect(createErrorBox).toHaveBeenCalledWith(expect.stringContaining('timed out'));
      expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
      expect(result).toBe(false); // Should return false on timeout

      vi.useRealTimers();
    });
  });

  describe('displayBufferedOutput()', () => {
    it('should display buffered output with header and footer', () => {
      const result: TaskRunResult = {
        success: true,
        stdout: ['line1', 'line2'],
        stderr: [],
      };

      const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      taskRunner.displayBufferedOutput(result, 'Test Step', false);

      expect(logSpy).toHaveBeenCalled();
      expect(writeSpy).toHaveBeenCalled();

      writeSpy.mockRestore();
      logSpy.mockRestore();
    });

    it('should handle nested output', () => {
      const result: TaskRunResult = {
        success: true,
        stdout: ['line1'],
        stderr: [],
      };

      const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      taskRunner.displayBufferedOutput(result, 'Test Step', true);

      expect(logSpy).toHaveBeenCalled();
      expect(writeSpy).toHaveBeenCalled();

      writeSpy.mockRestore();
      logSpy.mockRestore();
    });
  });

  describe('processStreamBuffer()', () => {
    it('should extract complete lines', () => {
      const taskRunnerAny = taskRunner as any;
      const result = taskRunnerAny.processStreamBuffer('line1\nline2\n', '');
      expect(result.lines).toEqual(['line1', 'line2']);
      expect(result.remaining).toBe('');
    });

    it('should keep incomplete line in buffer', () => {
      const taskRunnerAny = taskRunner as any;
      const result = taskRunnerAny.processStreamBuffer('line1\nincomplete', '');
      expect(result.lines).toEqual(['line1']);
      expect(result.remaining).toBe('incomplete');
    });

    it('should combine buffer with new chunk', () => {
      const taskRunnerAny = taskRunner as any;
      const result = taskRunnerAny.processStreamBuffer('line2\n', 'incomplete');
      // Buffer "incomplete" + chunk "line2\n" = "incompleteline2\n"
      // Should extract "incompleteline2" as a line
      expect(result.lines).toEqual(['incompleteline2']);
      expect(result.remaining).toBe('');
    });
  });
});

/**
 * Helper function to create a mock child process
 */
function createMockChildProcess() {
  const dataCallbacks: Array<(data: Buffer) => void> = [];
  const stderrCallbacks: Array<(data: Buffer) => void> = [];
  let closeCallback: ((code: number | null) => void) | null = null;
  let errorCallback: ((error: Error) => void) | null = null;

  const mockChild = {
    stdout: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          dataCallbacks.push(callback);
        }
        return mockChild.stdout;
      }),
      emit: vi.fn((event: string, data?: Buffer) => {
        if (event === 'data' && data) {
          dataCallbacks.forEach((cb) => cb(data));
        }
      }),
    },
    stderr: {
      on: vi.fn((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          stderrCallbacks.push(callback);
        }
        return mockChild.stderr;
      }),
      emit: vi.fn((event: string, data?: Buffer) => {
        if (event === 'data' && data) {
          stderrCallbacks.forEach((cb) => cb(data));
        }
      }),
    },
    on: vi.fn((event: string, callback: (...args: any[]) => void) => {
      if (event === 'close') {
        closeCallback = callback as (code: number | null) => void;
      } else if (event === 'error') {
        errorCallback = callback as (error: Error) => void;
      }
      return mockChild;
    }),
    emit: vi.fn((event: string, ...args: any[]) => {
      if (event === 'close' && closeCallback) {
        closeCallback(args[0] as number | null);
      } else if (event === 'error' && errorCallback) {
        errorCallback(args[0] as Error);
      }
    }),
    kill: vi.fn(),
  };

  return mockChild;
}
