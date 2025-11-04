/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  // Run a global setup once per test run (avoids running DB reset concurrently in workers)
  globalSetup: './src/test/global-setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'dist/'
      ],
    },
  },
});