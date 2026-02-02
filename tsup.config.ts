import { readFileSync } from 'fs';
import { defineConfig } from 'tsup';

// Read version from package.json at build time
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  entry: ['src/cli/index.ts'],
  format: ['cjs'],
  dts: true,
  minify: true,
  splitting: false,
  platform: 'node',
  target: 'node18',
  // Inject version at build time
  define: {
    __BUILD_VERSION__: JSON.stringify(packageJson.version),
  },
  // Exclude ESM-only modules from bundling - they will be included in pkg assets
  // These modules support CJS but have issues when bundled by tsup
  // inquirer v9 supports CJS, so we can bundle it
  external: ['chalk', 'boxen', 'log-update', 'ora', 'yaml'],
  // Bundle all other dependencies including ESM modules
  // tsup uses esbuild which can convert ESM to CJS
});
