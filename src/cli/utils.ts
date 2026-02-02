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
 * Avoids using createRequire in pkg environment to prevent ESM module errors
 */
export function getVersion(): string {
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
      // Normal Node.js environment - use file system directly
      try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        // Try relative to current file (dist/cli/utils.js -> package.json)
        const packageJsonPath = resolve(__dirname, '../../package.json');
        if (existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
          return packageJson.version ?? '0.0.0';
        }
      } catch {
        // Ignore
      }
    }
  } catch {
    // Ignore all errors
  }

  return '0.0.0';
}
