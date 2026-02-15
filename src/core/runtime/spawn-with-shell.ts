import { spawn } from 'child_process';

export interface SpawnOptions {
  stdio: ['inherit', 'pipe', 'pipe'];
  shell?: boolean | string;
  cwd?: string;
}

export function spawnWithShell(
  command: string,
  workingDirectory?: string,
  shell?: string[]
): ReturnType<typeof spawn> {
  if (shell && shell.length > 0) {
    const program = shell[0];
    const args = [...shell.slice(1), command];
    const options: SpawnOptions = {
      stdio: ['inherit', 'pipe', 'pipe'],
    };
    if (workingDirectory) {
      options.cwd = workingDirectory;
    }
    return spawn(program, args, options);
  }

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
