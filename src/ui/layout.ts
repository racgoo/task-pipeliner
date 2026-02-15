import { uiBoxPreset } from './primitives';

export interface BoxOptions {
  title?: string;
  borderColor?: 'cyan' | 'green' | 'yellow' | 'red' | 'blue';
  isNested?: boolean;
}

/**
 * Create step header box
 */
export function createStepHeaderBox(
  content: string,
  lineNumber?: number,
  fileName?: string,
  options: BoxOptions = {}
): string {
  const { borderColor = 'cyan', isNested = false } = options;

  let title: string | undefined;
  if (lineNumber !== undefined) {
    title = fileName ? `line ${lineNumber} in ${fileName}` : `line ${lineNumber}`;
  }

  const displayContent = isNested ? `│ ${content}` : `> ${content}`;

  return uiBoxPreset.panel(displayContent, {
    title,
    borderColor,
  });
}

/**
 * Create error box
 */
export function createErrorBox(error: string): string {
  return uiBoxPreset.error(`✗ ${error}`);
}

/**
 * Create parallel execution header box
 */
export function createParallelHeaderBox(branchCount: number): string {
  return uiBoxPreset.warning(`> Starting parallel execution (${branchCount} branches)`);
}
