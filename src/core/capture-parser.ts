/**
 * Capture Parser
 *
 * Parses stdout output using various capture strategies and extracts values
 * to be stored as variables in the workspace.
 */

import type { Capture } from '@tp-types/workflow';
import { JSONPath } from 'jsonpath-plus';
import { parse } from 'yaml';

/**
 * Parse stdout using a capture strategy
 * @param capture - Capture strategy definition
 * @param stdout - Array of stdout lines
 * @returns Extracted value as string, or null if parsing failed
 */
export function parseCapture(capture: Capture, stdout: string[]): string | null {
  try {
    const fullText = stdout.join('\n');

    // Full capture (no filtering)
    if (
      !('regex' in capture) &&
      !('json' in capture) &&
      !('yaml' in capture) &&
      !('yml' in capture) &&
      !('kv' in capture) &&
      !('after' in capture) &&
      !('before' in capture) &&
      !('line' in capture)
    ) {
      return fullText;
    }

    // Regex capture
    if ('regex' in capture) {
      const regex = new RegExp(capture.regex);
      const match = fullText.match(regex);
      if (match && match[1]) {
        return match[1];
      }
      return null;
    }

    // JSON capture
    if ('json' in capture) {
      try {
        const jsonData = JSON.parse(fullText);
        const results = JSONPath({ path: capture.json, json: jsonData });
        if (results && results.length > 0) {
          const value = results[0];
          return typeof value === 'string' ? value : JSON.stringify(value);
        }
        return null;
      } catch {
        return null;
      }
    }

    // YAML/YML capture
    if ('yaml' in capture || 'yml' in capture) {
      try {
        const yamlData = parse(fullText);
        const jsonPath = 'yaml' in capture ? capture.yaml : capture.yml;
        const results = JSONPath({ path: jsonPath, json: yamlData });
        if (results && results.length > 0) {
          const value = results[0];
          return typeof value === 'string' ? value : JSON.stringify(value);
        }
        return null;
      } catch {
        return null;
      }
    }

    // KV capture (key-value, .env style)
    if ('kv' in capture && typeof capture.kv === 'string') {
      const key = capture.kv.trim();
      // Require non-empty key so we never match "=value" or mis-handle missing key
      if (!key) {
        return null;
      }

      for (const line of stdout) {
        const trimmed = line.trim();
        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) {
          continue;
        }

        // Match key=value (exact key match, not prefix). Keys with underscores (e.g. TOP_SECRET)
        // are supported; only regex-special chars in the key are escaped.
        const exactKeyPattern = `^${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=\\s*(.+)$`;
        const match = trimmed.match(new RegExp(exactKeyPattern));
        if (match && match[1]) {
          // Extract value and remove surrounding quotes if present.
          // Value is everything after the first "=" (so KEY=VAL with VAL containing "=" is valid).
          const value = match[1].trim().replace(/^["']|["']$/g, '');
          return value;
        }
      }
      return null;
    }

    // Before/After/Between capture
    if ('after' in capture || 'before' in capture) {
      const afterMarker = 'after' in capture ? capture.after : '';
      const beforeMarker = 'before' in capture ? capture.before : undefined;

      if (afterMarker) {
        const afterIndex = fullText.indexOf(afterMarker);
        if (afterIndex === -1) {
          return null;
        }

        const startIndex = afterIndex + afterMarker.length;
        let endIndex = fullText.length;

        if (beforeMarker) {
          const beforeIndex = fullText.indexOf(beforeMarker, startIndex);
          if (beforeIndex === -1) {
            return null;
          }
          endIndex = beforeIndex;
        }

        return fullText.substring(startIndex, endIndex).trim();
      }

      if (beforeMarker) {
        const beforeIndex = fullText.indexOf(beforeMarker);
        if (beforeIndex === -1) {
          return null;
        }
        return fullText.substring(0, beforeIndex).trim();
      }
    }

    // Line range capture
    if ('line' in capture) {
      const { from, to } = capture.line;
      // from and to are 1-based, inclusive
      // Example: from=3, to=5 means lines 3, 4, and 5
      // Convert to 0-based: indices 2, 3, 4
      // slice(2, 5) returns indices 2, 3, 4 (5 is exclusive), so we need toIndex = to (not to-1)
      // Actually: slice(2, 5) = [2, 3, 4] which is lines 3, 4, 5 ✓
      const fromIndex = Math.max(0, from - 1);
      const toIndex = Math.min(stdout.length, to); // to is inclusive, slice end is exclusive

      if (fromIndex >= stdout.length || toIndex <= fromIndex || fromIndex < 0 || to < from) {
        return null;
      }

      return stdout.slice(fromIndex, toIndex).join('\n');
    }

    return null;
  } catch {
    // Any parsing error returns null (skip this capture)
    return null;
  }
}
