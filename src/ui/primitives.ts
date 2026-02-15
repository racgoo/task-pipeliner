import boxen, { type Options as BoxenOptions } from 'boxen';
import chalk from 'chalk';

/**
 * Shared UI styling primitives.
 * Prefer these helpers over directly composing chalk/boxen in feature code.
 */
export const uiTone = {
  success: (value: string) => chalk.green(value),
  error: (value: string) => chalk.red(value),
  warning: (value: string) => chalk.yellow(value),
  info: (value: string) => chalk.blue(value),
  accent: (value: string) => chalk.cyan(value),
  muted: (value: string) => chalk.gray(value),
  subtle: (value: string) => chalk.dim(value),
  plain: (value: string) => chalk.white(value),
  strong: (value: string) => chalk.bold(value),
};

export const uiMessage = {
  successLine: (message: string) => uiTone.success(`\n✓ ${message}`),
  errorLine: (message: string) => uiTone.error(`\n✗ ${message}`),
  warningLine: (message: string) => uiTone.warning(`\n⚠ ${message}`),
  cancelledLine: () => uiTone.warning('\n✗ Cancelled'),
};

const roundBoxDefaults: BoxenOptions = {
  borderStyle: 'round',
  padding: { top: 0, bottom: 0, left: 1, right: 1 },
  margin: { top: 0, bottom: 0, left: 0, right: 0 },
};

export const uiBoxPreset = {
  panel: (content: string, options: BoxenOptions = {}) =>
    boxen(content, { ...roundBoxDefaults, ...options }),
  error: (content: string, options: BoxenOptions = {}) =>
    boxen(content, { ...roundBoxDefaults, borderColor: 'red', ...options }),
  warning: (content: string, options: BoxenOptions = {}) =>
    boxen(content, { ...roundBoxDefaults, borderColor: 'yellow', ...options }),
  info: (content: string, options: BoxenOptions = {}) =>
    boxen(content, { ...roundBoxDefaults, borderColor: 'cyan', ...options }),
};

/**
 * Backward compatibility exports.
 * Keep during migration for modules that still use low-level APIs.
 */
export const uiText = chalk;
export const uiBox = boxen;
