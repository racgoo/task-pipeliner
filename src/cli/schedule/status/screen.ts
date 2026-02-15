/** Clear screen and move cursor to top so status always draws from top (avoids top being cut off with many schedules) */
export function clearScreenToTop(): void {
  process.stdout.write('\x1b[2J\x1b[H');
}
