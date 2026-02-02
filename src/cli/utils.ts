import { readFileSync } from 'fs';
import { createRequire } from 'module';
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
 */
export function getVersion(): string {
  // Check if running in pkg environment
  const processWithPkg = process as NodeJS.Process & { pkg?: { entrypoint?: string } };
  const isPkg = typeof process !== 'undefined' && processWithPkg.pkg !== undefined;

  try {
    if (isPkg) {
      // In pkg environment, try to read package.json from executable directory
      try {
        const packageJsonPath = resolve(dirname(process.execPath), 'package.json');
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        return packageJson.version ?? '0.0.0';
      } catch {
        // Fallback: try to read from snapshot
        const require = createRequire(import.meta.url);
        const packageJson = require('./package.json');
        return packageJson.version ?? '0.0.0';
      }
    } else {
      // Normal Node.js environment
      try {
        const require = createRequire(import.meta.url);
        const packageJson = require('../package.json');
        return packageJson.version ?? '0.0.0';
      } catch {
        // Fallback: try to read package.json from project root
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const packageJsonPath = resolve(__dirname, '../../package.json');
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        return packageJson.version ?? '0.0.0';
      }
    }
  } catch {
    return '0.0.0';
  }
}
