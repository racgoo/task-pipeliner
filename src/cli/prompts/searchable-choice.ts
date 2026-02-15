import * as readline from 'readline';
import { uiTone } from '@ui/primitives';

export interface ChoiceOption {
  id: string;
  label: string;
}

/**
 * Searchable choice menu (raw terminal input).
 * Arrow keys to move, type to filter. In-place redraw on main screen (no 1049h/1049l).
 * Redraw: move cursor up by last-drawn line count, clear to end of screen (0J), then single write
 * of the full frame so content above the prompt is not erased.
 */
export async function promptSearchableChoice(
  message: string,
  options: ChoiceOption[],
  pageSize: number
): Promise<ChoiceOption> {
  return new Promise((resolve) => {
    let searchTerm = '';
    let selectedIndex = 0;
    let filteredOptions = [...options];
    /** Lines drawn last time; move up by this many so we only clear/redraw our block (not above) */
    let lastDrawnLines = 0;

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    // Hide cursor (25l). No alternate screen (1049h/1049l)
    process.stdout.write('\x1B[?25l');

    const render = () => {
      const maxVisible = pageSize;
      let startIndex = 0;
      let endIndex = filteredOptions.length;

      if (filteredOptions.length > maxVisible) {
        const halfVisible = Math.floor(maxVisible / 2);
        startIndex = Math.max(0, selectedIndex - halfVisible);
        endIndex = Math.min(filteredOptions.length, startIndex + maxVisible);
        if (endIndex === filteredOptions.length) {
          startIndex = Math.max(0, endIndex - maxVisible);
        }
      }

      const searchDisplay = searchTerm
        ? uiTone.muted(`  Filter: ${searchTerm}`) +
          uiTone.muted(` (${filteredOptions.length}/${options.length})`)
        : uiTone.muted('  Type to filter, ↑↓ to navigate, Enter to select');

      const lines: string[] = [uiTone.accent(`? ${message}`), searchDisplay, ''];
      if (filteredOptions.length === 0) {
        lines.push(uiTone.warning('  No matches found'));
      } else {
        if (startIndex > 0) {
          lines.push(uiTone.muted(`  ↑ ${startIndex} more above`));
        }
        for (let i = startIndex; i < endIndex; i++) {
          const opt = filteredOptions[i];
          lines.push(
            i === selectedIndex ? uiTone.accent(`❯ ${opt.label}`) : uiTone.plain(`  ${opt.label}`)
          );
        }
        if (endIndex < filteredOptions.length) {
          lines.push(uiTone.muted(`  ↓ ${filteredOptions.length - endIndex} more below`));
        }
      }

      // One write: cursor up N (exact block height), 0J clear, then frame. Preserves lines above.
      const drawn = lines.length;
      const moveUp = lastDrawnLines > 0 ? lastDrawnLines : 0;
      const prefix = moveUp > 0 ? `\x1B[${moveUp}A\x1B[0J` : '';
      process.stdout.write(`${prefix}${lines.join('\n')}\n`);

      lastDrawnLines = drawn;
    };

    /** Filter options by search term and clamp selected index */
    const updateFilter = () => {
      const term = searchTerm.toLowerCase();
      filteredOptions = term
        ? options.filter((opt) => opt.label.toLowerCase().includes(term))
        : [...options];

      if (selectedIndex >= filteredOptions.length) {
        selectedIndex = Math.max(0, filteredOptions.length - 1);
      }
    };

    const onData = (key: Buffer) => {
      const keyStr = key.toString();

      if (keyStr === '\x03') {
        cleanup();
        process.exit(0);
      }
      if (keyStr === '\r' || keyStr === '\n') {
        if (filteredOptions.length > 0) {
          cleanup();
          resolve(filteredOptions[selectedIndex]);
        }
        return;
      }
      if (keyStr === '\x1B' && key.length === 1) {
        if (searchTerm) {
          searchTerm = '';
          updateFilter();
          render();
        }
        return;
      }
      if (keyStr === '\x1B[A') {
        if (filteredOptions.length > 0) {
          selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : filteredOptions.length - 1;
          render();
        }
        return;
      }
      if (keyStr === '\x1B[B') {
        if (filteredOptions.length > 0) {
          selectedIndex = selectedIndex < filteredOptions.length - 1 ? selectedIndex + 1 : 0;
          render();
        }
        return;
      }
      if (keyStr === '\x7F' || keyStr === '\b') {
        if (searchTerm.length > 0) {
          searchTerm = searchTerm.slice(0, -1);
          updateFilter();
          render();
        }
        return;
      }
      if (keyStr.length === 1 && keyStr >= ' ' && keyStr <= '~') {
        searchTerm += keyStr;
        updateFilter();
        render();
      }
    };

    /** Remove listener, restore raw mode, close readline, show cursor (25h). No 1049l. */
    const cleanup = () => {
      process.stdin.removeListener('data', onData);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      rl.close();
      process.stdout.write('\x1B[?25h');
    };

    render();
    process.stdin.on('data', onData);
  });
}
