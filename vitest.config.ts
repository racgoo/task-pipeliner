import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Exclude example projects from test discovery
    exclude: ['**/node_modules/**', '**/dist/**', '**/examples/**', '**/*.config.*'],
  },
});
