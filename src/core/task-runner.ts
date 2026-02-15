/**
 * Task Runner
 *
 * Executes shell commands and displays output in a nice box format.
 *
 * Two modes:
 * 1. Real-time mode: Output appears immediately as command runs (normal execution)
 * 2. Buffered mode: Collect all output first, display later (parallel execution)
 *
 * Features:
 * - Box-style output with borders
 * - Line-by-line streaming
 * - Error handling
 * - Working directory support (baseDir)
 */
import { spawn } from 'child_process';
import {
  createStepHeaderBox,
  createStepFooterMessage,
  createErrorBox,
  formatNestedLine,
} from '@ui/index';

export interface TaskRunResult {
  success: boolean;
  stdout: string[];
  stderr: string[];
}

interface SpawnOptions {
  stdio: ['inherit', 'pipe', 'pipe'];
  shell?: boolean | string;
  cwd?: string;
}

export class TaskRunner {
  /**
   * Run a task command with box-style output streaming
   *
   * @param command - Shell command to execute
   * @param stepIndex - Step index in workflow (for tracking)
   * @param stepName - Display name for the step
   * @param branchIndex - Branch index for parallel execution
   * @param bufferOutput - If true, collect output instead of displaying immediately
   * @param hasCondition - If true, step has a condition (affects border color)
   * @param lineNumber - Line number in YAML file (for error reporting)
   * @param fileName - YAML file name (for error reporting)
   * @param cwd - Working directory for command execution
   * @param timeout - Timeout in seconds (optional)
   * @param shell - Shell configuration (e.g., ["bash", "-lc"])
   */
  async run(
    command: string,
    stepIndex?: number,
    stepName?: string,
    branchIndex?: number,
    bufferOutput: boolean = false,
    hasCondition: boolean = false,
    lineNumber?: number,
    fileName?: string,
    cwd?: string,
    timeout?: number,
    shell?: string[]
  ): Promise<boolean | TaskRunResult> {
    // Choose mode based on bufferOutput flag
    if (bufferOutput) {
      // Collect output for later display (parallel execution)
      return this.runBuffered(command, cwd, timeout, shell);
    } else {
      // Display output immediately (normal execution)
      return this.runRealtime(
        command,
        stepName ?? command,
        hasCondition,
        lineNumber,
        fileName,
        cwd,
        timeout,
        shell
      );
    }
  }

  /**
   * Run command in buffered mode (collect all output for later display)
   * Used for parallel execution where we need to collect output first
   */
  private async runBuffered(
    command: string,
    workingDirectory?: string,
    timeoutSeconds?: number,
    shell?: string[]
  ): Promise<TaskRunResult> {
    return new Promise<TaskRunResult>((resolve, _reject) => {
      // Spawn child process with shell configuration
      const child = this.spawnWithShell(command, workingDirectory, shell);
      const allStdoutLines: string[] = [];
      const allStderrLines: string[] = [];
      let incompleteStdoutLine = '';
      let incompleteStderrLine = '';
      let timeoutId: NodeJS.Timeout | null = null;

      // Set up timeout if specified
      if (timeoutSeconds && timeoutSeconds > 0) {
        timeoutId = setTimeout(() => {
          child.kill('SIGTERM');
          const timeoutMessage = `Command timed out after ${timeoutSeconds} seconds`;
          allStderrLines.push(timeoutMessage);
          resolve({ success: false, stdout: allStdoutLines, stderr: allStderrLines });
        }, timeoutSeconds * 1000);
      }

      // Collect stdout lines
      child.stdout?.on('data', (data: Buffer) => {
        const dataChunk = data.toString();
        const { lines: completeLines, remaining: incompleteLine } = this.processStreamBuffer(
          dataChunk,
          incompleteStdoutLine
        );
        allStdoutLines.push(...completeLines);
        incompleteStdoutLine = incompleteLine;
      });

      // Collect stderr lines
      child.stderr?.on('data', (data: Buffer) => {
        const dataChunk = data.toString();
        const { lines: completeLines, remaining: incompleteLine } = this.processStreamBuffer(
          dataChunk,
          incompleteStderrLine
        );
        allStderrLines.push(...completeLines);
        incompleteStderrLine = incompleteLine;
      });

      // When process finishes, add any remaining incomplete lines
      child.on('close', (exitCode: number | null) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (incompleteStdoutLine.trim()) {
          allStdoutLines.push(incompleteStdoutLine);
        }
        if (incompleteStderrLine.trim()) {
          allStderrLines.push(incompleteStderrLine);
        }
        const success = exitCode === 0;
        resolve({ success, stdout: allStdoutLines, stderr: allStderrLines });
      });

      child.on('error', (error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        const errorMessage = `Error: ${error.message}`;
        resolve({
          success: false,
          stdout: allStdoutLines,
          stderr: [...allStderrLines, errorMessage],
        });
      });
    });
  }

  /**
   * Run command in real-time mode (output immediately as it happens)
   */
  private async runRealtime(
    command: string,
    displayName: string,
    hasWhenCondition: boolean,
    lineNumber?: number,
    fileName?: string,
    workingDirectory?: string,
    timeoutSeconds?: number,
    shell?: string[]
  ): Promise<boolean> {
    // Green border if step has condition, cyan otherwise
    const borderColor = hasWhenCondition ? 'green' : 'cyan';
    const headerBox = createStepHeaderBox(displayName, lineNumber, fileName, { borderColor });
    console.log(headerBox);

    // Record start time for duration calculation
    const startTime = Date.now();

    return new Promise<boolean>((resolve) => {
      // Spawn child process with shell configuration
      const child = this.spawnWithShell(command, workingDirectory, shell);
      let incompleteStdoutLine = '';
      let incompleteStderrLine = '';
      let timeoutId: NodeJS.Timeout | null = null;

      // Set up timeout if specified
      if (timeoutSeconds && timeoutSeconds > 0) {
        timeoutId = setTimeout(() => {
          child.kill('SIGTERM');
          const timeoutMessage = `Command timed out after ${timeoutSeconds} seconds`;
          const errorBox = createErrorBox(timeoutMessage);
          console.error(errorBox);
          const duration = Date.now() - startTime;
          const footerMessage = createStepFooterMessage(false, false, duration);
          console.log(footerMessage);
          resolve(false);
        }, timeoutSeconds * 1000);
      }

      // Process stdout: output complete lines immediately
      child.stdout?.on('data', (data: Buffer) => {
        const dataChunk = data.toString();
        const { lines: completeLines, remaining: incompleteLine } = this.processStreamBuffer(
          dataChunk,
          incompleteStdoutLine
        );
        completeLines.forEach((line) => process.stdout.write(`│ ${line}\n`));
        incompleteStdoutLine = incompleteLine;
      });

      // Process stderr: output complete lines immediately
      child.stderr?.on('data', (data: Buffer) => {
        const dataChunk = data.toString();
        const { lines: completeLines, remaining: incompleteLine } = this.processStreamBuffer(
          dataChunk,
          incompleteStderrLine
        );
        completeLines.forEach((line) => process.stderr.write(`│ ${line}\n`));
        incompleteStderrLine = incompleteLine;
      });

      // When process finishes, output any remaining incomplete lines
      child.on('close', (exitCode: number | null) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (incompleteStdoutLine.trim()) {
          process.stdout.write(`│ ${incompleteStdoutLine}\n`);
        }
        if (incompleteStderrLine.trim()) {
          process.stderr.write(`│ ${incompleteStderrLine}\n`);
        }

        const success = exitCode === 0;
        const duration = Date.now() - startTime;
        const footerMessage = createStepFooterMessage(success, false, duration);
        console.log(footerMessage);
        resolve(success);
      });

      child.on('error', (error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        const errorBox = createErrorBox(`Error: ${error.message}`);
        console.error(errorBox);
        resolve(false);
      });
    });
  }

  /**
   * Create spawn options with optional working directory
   */
  private createSpawnOptions(workingDirectory?: string): SpawnOptions {
    const options: SpawnOptions = {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
    };
    if (workingDirectory) {
      options.cwd = workingDirectory;
    }
    return options;
  }

  /**
   * Spawn child process with shell configuration
   *
   * @param command - Command to execute
   * @param workingDirectory - Working directory
   * @param shell - Shell configuration (e.g., ["bash", "-lc"])
   * @returns ChildProcess
   */
  private spawnWithShell(
    command: string,
    workingDirectory?: string,
    shell?: string[]
  ): ReturnType<typeof spawn> {
    if (shell && shell.length > 0) {
      // Use custom shell: shell[0] is program, shell[1..] are args, command is final arg
      const program = shell[0];
      const args = [...shell.slice(1), command];
      const options: SpawnOptions = {
        stdio: ['inherit', 'pipe', 'pipe'],
      };
      if (workingDirectory) {
        options.cwd = workingDirectory;
      }
      return spawn(program, args, options);
    } else {
      // Use user's current shell (from $SHELL or platform default)
      // This ensures commands run in the same shell environment as the user
      const userShell = process.env.SHELL ?? (process.platform === 'win32' ? 'cmd.exe' : '/bin/sh');
      const shellArg = process.platform === 'win32' ? '/c' : '-c';
      const options: SpawnOptions = {
        stdio: ['inherit', 'pipe', 'pipe'],
      };
      if (workingDirectory) {
        options.cwd = workingDirectory;
      }
      return spawn(userShell, [shellArg, command], options);
    }
  }

  /**
   * Process stream buffer and extract complete lines
   *
   * Command output comes in chunks, not necessarily line-by-line.
   * This function:
   * 1. Combines new chunk with existing buffer
   * 2. Extracts all complete lines (ending with \n)
   * 3. Keeps incomplete line in buffer for next chunk
   *
   * Example:
   * - Buffer: "Hello "
   * - Chunk: "World\nHow are"
   * - Result: lines=["Hello World"], remaining="How are"
   */
  private processStreamBuffer(
    chunk: string,
    buffer: string
  ): { lines: string[]; remaining: string } {
    const newBuffer = buffer + chunk;
    const lines: string[] = [];
    let remaining = newBuffer;

    // Extract all complete lines (ending with \n)
    while (remaining.includes('\n')) {
      const newlineIndex = remaining.indexOf('\n');
      const line = remaining.substring(0, newlineIndex);
      remaining = remaining.substring(newlineIndex + 1);
      lines.push(line);
    }

    return { lines, remaining };
  }

  /**
   * Format nested output (add | prefix for nested display)
   */
  private formatNestedOutput(content: string, isNested: boolean): void {
    if (isNested) {
      content.split('\n').forEach((line) => {
        if (line.trim()) {
          console.log(`| ${line}`);
        }
      });
    } else {
      console.log(content);
    }
  }

  /**
   * Display buffered output in box format (for parallel execution, nested display)
   */
  displayBufferedOutput(
    result: TaskRunResult,
    stepName: string,
    isNested: boolean = false,
    lineNumber?: number,
    fileName?: string
  ): void {
    const headerBox = createStepHeaderBox(stepName, lineNumber, fileName, {
      borderColor: 'cyan',
      isNested,
    });
    this.formatNestedOutput(headerBox, isNested);

    result.stdout.forEach((line) => {
      const formattedLine = formatNestedLine(line, isNested);
      process.stdout.write(`${formattedLine}\n`);
    });
    result.stderr.forEach((line) => {
      const formattedLine = formatNestedLine(line, isNested);
      process.stderr.write(`${formattedLine}\n`);
    });

    const footerMessage = createStepFooterMessage(result.success, isNested);
    console.log(footerMessage);
  }
}
