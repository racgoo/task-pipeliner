export class CliCommandError extends Error {
  readonly exitCode: number;
  readonly handled: boolean;

  constructor(message: string, exitCode: number = 1, handled: boolean = false) {
    super(message);
    this.name = 'CliCommandError';
    this.exitCode = exitCode;
    this.handled = handled;
  }
}

export function throwHandledCliError(exitCode: number = 1): never {
  throw new CliCommandError('', exitCode, true);
}

export async function runCommandAction(action: () => Promise<void>): Promise<void> {
  await action();
}
