/**
 * Task Runner
 *
 * Executes shell commands and displays output in a box-style format.
 */
import { spawn } from 'child_process';
import type { TaskRunOutputPort } from '@core/execution/ports';
import type { TaskRunResult } from '@tp-types/execution';
import { spawnWithShell as spawnWithShellHelper, type SpawnOptions } from './spawn-with-shell';
import { processStreamBuffer as processStreamBufferHelper } from './stream-buffer';

export type { TaskRunResult } from '@tp-types/execution';

interface TaskRunnerDeps {
  outputPort: TaskRunOutputPort;
}

export class TaskRunner {
  private outputPort: TaskRunOutputPort;

  constructor(deps?: TaskRunnerDeps) {
    this.outputPort = deps?.outputPort ?? {
      createStepHeaderBox: (content) => content,
      createStepFooterMessage: (success, _isNested, durationMs) =>
        success ? `✓ Completed (${durationMs ?? 0}ms)` : `✗ Failed (${durationMs ?? 0}ms)`,
      createErrorBox: (error) => error,
      formatNestedLine: (line) => line,
      createParallelHeaderBox: (branchCount) =>
        `Starting parallel execution (${branchCount} branches)`,
      createParallelFooterMessage: (allSucceeded) =>
        allSucceeded ? 'All parallel branches completed' : 'Some parallel branches failed',
    };
  }

  async run(
    command: string,
    _stepIndex?: number,
    stepName?: string,
    _branchIndex?: number,
    bufferOutput: boolean = false,
    hasCondition: boolean = false,
    lineNumber?: number,
    fileName?: string,
    cwd?: string,
    timeout?: number,
    shell?: string[]
  ): Promise<boolean | TaskRunResult> {
    if (bufferOutput) {
      return this.runBuffered(command, cwd, timeout, shell);
    }

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

  private async runBuffered(
    command: string,
    workingDirectory?: string,
    timeoutSeconds?: number,
    shell?: string[]
  ): Promise<TaskRunResult> {
    return new Promise<TaskRunResult>((resolve) => {
      const child = this.spawnWithShell(command, workingDirectory, shell);
      const allStdoutLines: string[] = [];
      const allStderrLines: string[] = [];
      let incompleteStdoutLine = '';
      let incompleteStderrLine = '';
      let timeoutId: NodeJS.Timeout | null = null;

      if (timeoutSeconds && timeoutSeconds > 0) {
        timeoutId = setTimeout(() => {
          child.kill('SIGTERM');
          const timeoutMessage = `Command timed out after ${timeoutSeconds} seconds`;
          allStderrLines.push(timeoutMessage);
          resolve({ success: false, stdout: allStdoutLines, stderr: allStderrLines });
        }, timeoutSeconds * 1000);
      }

      child.stdout?.on('data', (data: Buffer) => {
        const dataChunk = data.toString();
        const { lines: completeLines, remaining: incompleteLine } = this.processStreamBuffer(
          dataChunk,
          incompleteStdoutLine
        );
        allStdoutLines.push(...completeLines);
        incompleteStdoutLine = incompleteLine;
      });

      child.stderr?.on('data', (data: Buffer) => {
        const dataChunk = data.toString();
        const { lines: completeLines, remaining: incompleteLine } = this.processStreamBuffer(
          dataChunk,
          incompleteStderrLine
        );
        allStderrLines.push(...completeLines);
        incompleteStderrLine = incompleteLine;
      });

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
    const borderColor = hasWhenCondition ? 'green' : 'cyan';
    const headerBox = this.outputPort.createStepHeaderBox(displayName, lineNumber, fileName, {
      borderColor,
    });
    console.log(headerBox);

    const startTime = Date.now();

    return new Promise<boolean>((resolve) => {
      const child = this.spawnWithShell(command, workingDirectory, shell);
      let incompleteStdoutLine = '';
      let incompleteStderrLine = '';
      let timeoutId: NodeJS.Timeout | null = null;

      if (timeoutSeconds && timeoutSeconds > 0) {
        timeoutId = setTimeout(() => {
          child.kill('SIGTERM');
          const timeoutMessage = `Command timed out after ${timeoutSeconds} seconds`;
          const errorBox = this.outputPort.createErrorBox(timeoutMessage);
          console.error(errorBox);
          const duration = Date.now() - startTime;
          const footerMessage = this.outputPort.createStepFooterMessage(false, false, duration);
          console.log(footerMessage);
          resolve(false);
        }, timeoutSeconds * 1000);
      }

      child.stdout?.on('data', (data: Buffer) => {
        const dataChunk = data.toString();
        const { lines: completeLines, remaining: incompleteLine } = this.processStreamBuffer(
          dataChunk,
          incompleteStdoutLine
        );
        completeLines.forEach((line) => process.stdout.write(`│ ${line}\n`));
        incompleteStdoutLine = incompleteLine;
      });

      child.stderr?.on('data', (data: Buffer) => {
        const dataChunk = data.toString();
        const { lines: completeLines, remaining: incompleteLine } = this.processStreamBuffer(
          dataChunk,
          incompleteStderrLine
        );
        completeLines.forEach((line) => process.stderr.write(`│ ${line}\n`));
        incompleteStderrLine = incompleteLine;
      });

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
        const footerMessage = this.outputPort.createStepFooterMessage(success, false, duration);
        console.log(footerMessage);
        resolve(success);
      });

      child.on('error', (error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        const errorBox = this.outputPort.createErrorBox(`Error: ${error.message}`);
        console.error(errorBox);
        resolve(false);
      });
    });
  }

  // Kept for compatibility with existing unit tests
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

  // Kept for compatibility with existing unit tests
  private spawnWithShell(
    command: string,
    workingDirectory?: string,
    shell?: string[]
  ): ReturnType<typeof spawn> {
    return spawnWithShellHelper(command, workingDirectory, shell);
  }

  // Kept for compatibility with existing unit tests
  private processStreamBuffer(
    chunk: string,
    buffer: string
  ): { lines: string[]; remaining: string } {
    return processStreamBufferHelper(chunk, buffer);
  }

  private formatNestedOutput(content: string, isNested: boolean): void {
    if (isNested) {
      content.split('\n').forEach((line) => {
        if (line.trim()) {
          console.log(`| ${line}`);
        }
      });
      return;
    }

    console.log(content);
  }

  displayBufferedOutput(
    result: TaskRunResult,
    stepName: string,
    isNested: boolean = false,
    lineNumber?: number,
    fileName?: string
  ): void {
    const headerBox = this.outputPort.createStepHeaderBox(stepName, lineNumber, fileName, {
      borderColor: 'cyan',
      isNested,
    });
    this.formatNestedOutput(headerBox, isNested);

    result.stdout.forEach((line) => {
      const formattedLine = this.outputPort.formatNestedLine(line, isNested);
      process.stdout.write(`${formattedLine}\n`);
    });
    result.stderr.forEach((line) => {
      const formattedLine = this.outputPort.formatNestedLine(line, isNested);
      process.stderr.write(`${formattedLine}\n`);
    });

    const footerMessage = this.outputPort.createStepFooterMessage(result.success, isNested);
    console.log(footerMessage);
  }
}
