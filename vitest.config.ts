import { defineConfig } from 'vitest/config';

/**
 * Root Vitest configuration.
 *
 * Package unit tests live next to their source as `*.test.ts`. Tests import
 * from their own package using relative paths, so no path-alias resolution is
 * required here. The Next.js app is typechecked and built separately.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'apps/**'],
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['packages/**/src/**/*.ts'],
    },
  },
});
