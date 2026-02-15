import { uiText as chalk } from '@ui/primitives';
import logUpdate from 'log-update';

const VIEWPORT_FOOTER_LINES = 2;
const DEFAULT_ROWS = 24;

export function getViewportHeight(): number {
  const rows = typeof process.stdout.rows === 'number' ? process.stdout.rows : DEFAULT_ROWS;
  return Math.max(5, rows - VIEWPORT_FOOTER_LINES);
}

/** Parse key from stdin buffer (arrow keys, page up/down, home/end) */
export function parseScrollKey(
  data: Buffer
): 'up' | 'down' | 'pageup' | 'pagedown' | 'home' | 'end' | null {
  const s = data.toString('utf8');
  if (s === '\u001b[A') return 'up';
  if (s === '\u001b[B') return 'down';
  if (s === '\u001b[5~') return 'pageup';
  if (s === '\u001b[6~') return 'pagedown';
  if (s === '\u001b[H' || s === '\u001b[1~') return 'home';
  if (s === '\u001b[4~' || s === '\u001b[F') return 'end';
  return null;
}

export interface ViewportState {
  lines: string[];
  footer: string;
  scrollOffset: number;
}

export function renderViewport(viewportHeight: number, state: ViewportState): ViewportState {
  const total = state.lines.length;
  const maxScroll = Math.max(0, total - viewportHeight);
  const clamped = Math.min(state.scrollOffset, maxScroll);
  const nextState = { ...state, scrollOffset: clamped };

  const view = nextState.lines
    .slice(nextState.scrollOffset, nextState.scrollOffset + viewportHeight)
    .join('\n');
  const scrollHint =
    total > viewportHeight
      ? chalk.dim(
          ` [${nextState.scrollOffset + 1}-${Math.min(nextState.scrollOffset + viewportHeight, total)}/${total}] ↑/↓ PgUp/PgDn: scroll`
        )
      : '';

  logUpdate(`${view}\n${nextState.footer}${scrollHint}`);
  return nextState;
}

export function applyScrollKey(
  key: 'up' | 'down' | 'pageup' | 'pagedown' | 'home' | 'end',
  viewportHeight: number,
  linesLength: number,
  currentOffset: number
): number {
  const maxScroll = Math.max(0, linesLength - viewportHeight);

  switch (key) {
    case 'up':
      return Math.max(0, currentOffset - 1);
    case 'down':
      return Math.min(maxScroll, currentOffset + 1);
    case 'pageup':
      return Math.max(0, currentOffset - viewportHeight);
    case 'pagedown':
      return Math.min(maxScroll, currentOffset + viewportHeight);
    case 'home':
      return 0;
    case 'end':
      return maxScroll;
    default:
      return currentOffset;
  }
}
