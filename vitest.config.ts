import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Exclude example projects from test discovery
    exclude: ['**/node_modules/**', '**/dist/**', '**/examples/**', '**/*.config.*'],
    // Improve test performance
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'json-summary'],
      include: ['src/core/**/*.ts', 'src/cli/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/__tests__/**',
        'src/**/*.d.ts',
        'src/cli/index.ts', // CLI entry point - integration tested via executor tests
      ],
    },
  },
});
