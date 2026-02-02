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
 * Get Node.js require function
 * Always use CJS-style require since build output is CJS
 */
function getRequireFunction(): NodeRequire {
  // Try global require first (available in pkg and CommonJS contexts)
  const globalRequire = (globalThis as { require?: NodeRequire }).require;
  if (globalRequire) {
    return globalRequire;
  }

  // Fallback to createRequire for ESM source context (development)
  // Even though build output is CJS, source code may run in ESM during development
  try {
    return createRequire(import.meta.url);
  } catch {
    throw new Error('require is not available');
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
