import { readFileSync, existsSync } from 'fs';
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
