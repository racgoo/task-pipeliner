/**
 * Module Loader Utilities
 * Helper functions for loading native .node modules in ESM
 * Compatible with pkg packaging
 */

import { existsSync } from 'fs';
import { createRequire } from 'module';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

/**
 * Type definition for pkg environment
 */
interface PkgEnvironment {
  entrypoint?: string;
}

/**
 * Extended process type with pkg property
 */
interface ProcessWithPkg extends NodeJS.Process {
  pkg?: PkgEnvironment;
}

/**
 * Get possible paths for a native module
 * @param moduleName - Name of the module file (e.g., 'task-pipeliner-rs.node')
 * @returns Array of possible paths to try
 */
export function getModulePaths(moduleName: string): string[] {
  const processWithPkg = process as ProcessWithPkg;
  const pkg = processWithPkg.pkg;
  const isPkg = typeof process !== 'undefined' && pkg !== undefined;

  const paths: string[] = [];

  if (isPkg) {
    // pkg environment: use process.execPath directory
    paths.push(resolve(dirname(process.execPath), moduleName));
    if (pkg?.entrypoint) {
      paths.push(resolve(dirname(pkg.entrypoint), `../${moduleName}`));
    }
  } else {
    // Normal ESM: use import.meta.url
    try {
      paths.push(resolve(dirname(fileURLToPath(import.meta.url)), `../${moduleName}`));
      const require = createRequire(import.meta.url);
      paths.push(require.resolve(`../${moduleName}`));
    } catch {
      // Ignore if import.meta.url fails
    }
  }

  return paths;
}

/**
 * Module with runTask method (for type checking)
 */
interface ModuleWithRunTask {
  runTask?: (command: string) => Promise<boolean> | boolean;
}

/**
 * Type for Node.js require function
 */
type NodeRequire = (id: string) => unknown;

/**
 * Get Node.js require function based on environment
 * In pkg environment, use global require directly
 * In ESM environment, use createRequire
 */
function getRequireFunction(): NodeRequire {
  const processWithPkg = process as ProcessWithPkg;
  const isPkg = typeof process !== 'undefined' && processWithPkg.pkg !== undefined;

  if (isPkg) {
    // In pkg environment, CommonJS require is available globally
    return (
      (globalThis as { require?: NodeRequire }).require ??
      (() => {
        throw new Error('require is not available in pkg environment');
      })
    );
  }

  // In normal ESM environment, use createRequire
  try {
    return createRequire(import.meta.url);
  } catch {
    // Fallback to global require if createRequire fails
    return (
      (globalThis as { require?: NodeRequire }).require ??
      (() => {
        throw new Error('require is not available');
      })
    );
  }
}

/**
 * Try to load a module from multiple paths
 * @param paths - Array of paths to try
 * @returns Loaded module or null if not found
 */
export function tryLoadModule(paths: string[]): ModuleWithRunTask | null {
  const requireFn = getRequireFunction();

  for (const nodePath of paths) {
    try {
      if (existsSync(nodePath)) {
        const module = requireFn(nodePath);
        return module as ModuleWithRunTask;
      }
    } catch {
      continue;
    }
  }

  return null;
}
