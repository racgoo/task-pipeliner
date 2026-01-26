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
import {
  createStepHeaderBox,
  createStepFooterMessage,
  createErrorBox,
  formatNestedLine,
} from '../cli/ui.js';

export interface TaskRunResult {
  success: boolean;
  stdout: string[];
  stderr: string[];
}

interface SpawnOptions {
  stdio: ['inherit', 'pipe', 'pipe'];
  shell: true;
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
    timeout?: number
  ): Promise<boolean | TaskRunResult> {
    // Choose mode based on bufferOutput flag
    if (bufferOutput) {
      // Collect output for later display (parallel execution)
      return this.runBuffered(command, cwd, timeout);
    } else {
      // Display output immediately (normal execution)
      return this.runRealtime(
        command,
        stepName || command,
        hasCondition,
        lineNumber,
        fileName,
        cwd,
        timeout
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
    timeoutSeconds?: number
  ): Promise<TaskRunResult> {
    const { spawn } = await import('child_process');
    const [commandName, ...commandArgs] = this.parseCommand(command);
    const spawnOptions = this.createSpawnOptions(workingDirectory);

    return new Promise<TaskRunResult>((resolve, _reject) => {
      const child = spawn(commandName, commandArgs, spawnOptions);
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
    timeoutSeconds?: number
  ): Promise<boolean> {
    const { spawn } = await import('child_process');
    const [commandName, ...commandArgs] = this.parseCommand(command);
    const spawnOptions = this.createSpawnOptions(workingDirectory);

    // Green border if step has condition, cyan otherwise
    const borderColor = hasWhenCondition ? 'green' : 'cyan';
    const headerBox = createStepHeaderBox(displayName, lineNumber, fileName, { borderColor });
    console.log(headerBox);

    return new Promise<boolean>((resolve) => {
      const child = spawn(commandName, commandArgs, spawnOptions);
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
          const footerMessage = createStepFooterMessage(false);
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
        const footerMessage = createStepFooterMessage(success);
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
   * Parse command string into command and arguments
   */
  private parseCommand(command: string): [string, ...string[]] {
    const parts = command.split(' ');
    return [parts[0], ...parts.slice(1)];
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
