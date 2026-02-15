export function processStreamBuffer(
  chunk: string,
  buffer: string
): { lines: string[]; remaining: string } {
  const newBuffer = buffer + chunk;
  const lines: string[] = [];
  let remaining = newBuffer;

  while (remaining.includes('\n')) {
    const newlineIndex = remaining.indexOf('\n');
    const line = remaining.substring(0, newlineIndex);
    remaining = remaining.substring(newlineIndex + 1);
    lines.push(line);
  }

  return { lines, remaining };
}
