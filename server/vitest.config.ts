import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'e2e',
          include: ['tests/e2e/**/*.test.ts'],
          // Starts an in-memory MongoDB and the real app; tests talk to it over HTTP.
          globalSetup: ['tests/e2e/setup/local-server.ts'],
          testTimeout: 30_000,
          hookTimeout: 120_000, // the first run downloads a MongoDB binary
          fileParallelism: false, // the files share one database and call /reset
        },
      },
    ],
  },
});
