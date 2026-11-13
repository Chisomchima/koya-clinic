import { defineConfig } from 'vitest/config';

/**
 * Runs the end-to-end suite against a deployed instance:
 *   TEST_BASE_URL=https://... TEST_API_KEY=... npm run test:remote -w server
 * WARNING: the suite calls POST /reset, which wipes every booking on that instance.
 */
export default defineConfig({
  test: {
    include: ['tests/e2e/**/*.test.ts'],
    testTimeout: 60_000,
    fileParallelism: false,
  },
});
