import { readFileSync, existsSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

export function setSilentMode() {
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
  console.info = () => {};
  process.stdout.write = () => true;
  process.stderr.write = () => true;
}

/**
 * Get version from package.json
 * Compatible with both normal Node.js and pkg bundled executables
 * Uses build-time injected version as primary source, falls back to reading package.json
 */
export function getVersion(): string {
  // First, try build-time injected version (available in bundled code)
  // This will be replaced with the actual version string at build time by tsup define
  // @ts-expect-error - __BUILD_VERSION__ is injected at build time by tsup
  if (typeof __BUILD_VERSION__ !== 'undefined' && __BUILD_VERSION__) {
    // @ts-expect-error - __BUILD_VERSION__ is injected at build time by tsup
    return __BUILD_VERSION__;
  }

  // Check if running in pkg environment
  const processWithPkg = process as NodeJS.Process & { pkg?: { entrypoint?: string } };
  const isPkg = typeof process !== 'undefined' && processWithPkg.pkg !== undefined;

  try {
    if (isPkg) {
      // In pkg environment, package.json should be in the snapshot
      // Try multiple possible paths
      const possiblePaths = [
        // Try from executable directory (if package.json is copied there)
        resolve(dirname(process.execPath), 'package.json'),
        // Try from snapshot root
        '/snapshot/task-pipeliner/package.json',
        // Try from pkg entrypoint directory
        processWithPkg.pkg?.entrypoint
          ? resolve(dirname(processWithPkg.pkg.entrypoint), 'package.json')
          : null,
      ].filter((path): path is string => path !== null);

      for (const packageJsonPath of possiblePaths) {
        try {
          if (existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            return packageJson.version ?? '0.0.0';
          }
        } catch {
          continue;
        }
      }
    } else {
      // Normal Node.js environment - try multiple possible paths
      const possiblePaths = [
        // Try from current working directory
        resolve(process.cwd(), 'package.json'),
        // Try relative to current file (dist/cli/utils.js -> package.json)
        (() => {
          try {
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = dirname(__filename);
            return resolve(__dirname, '../../package.json');
          } catch {
            return null;
          }
        })(),
        // Try relative to dist/index.js (if bundled)
        (() => {
          try {
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = dirname(__filename);
            return resolve(__dirname, '../package.json');
          } catch {
            return null;
          }
        })(),
      ].filter((path): path is string => path !== null);

      for (const packageJsonPath of possiblePaths) {
        try {
          if (existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            return packageJson.version ?? '0.0.0';
          }
        } catch {
          continue;
        }
      }
    }
  } catch {
    // Ignore all errors
  }

  return '0.0.0';
}

/**
 * Find the nearest "tp" directory starting from the current working directory
 * and traversing up the directory tree
 * @param startDir Optional starting directory (defaults to process.cwd())
 * @returns The path to the nearest "tp" directory, or null if not found
 */
export function findNearestTpDirectory(startDir?: string): string | null {
  let currentDir = startDir ? resolve(startDir) : process.cwd();

  // Prevent infinite loop by limiting traversal depth
  const maxDepth = 50;
  let depth = 0;

  while (depth < maxDepth) {
    const tpDirPath = resolve(currentDir, 'tp');

    try {
      // Check if "tp" exists and is a directory
      if (existsSync(tpDirPath)) {
        const stats = statSync(tpDirPath);
        if (stats.isDirectory()) {
          return tpDirPath;
        }
      }
    } catch {
      // Ignore errors (permission denied, etc.)
    }

    // Move to parent directory
    const parentDir = dirname(currentDir);

    // Stop if we've reached the filesystem root
    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
    depth++;
  }

  return null;
}

/**
 * Parse -v/--var key=value pairs into a record. Throws if any pair is invalid.
 * Splits on the first '='; value may contain '='. Key must be non-empty after trim.
 */
export function parseVarPairs(pairs: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of pairs) {
    const eq = pair.indexOf('=');
    if (eq === -1) {
      throw new Error(`Invalid -v/--var format: "${pair}". Use key=value (e.g. -v version=1.0.0).`);
    }
    const key = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (!key) {
      throw new Error(`Invalid -v/--var format: key is empty in "${pair}". Use key=value.`);
    }
    out[key] = value;
  }
  return out;
}
