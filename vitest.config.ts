import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Root Vitest configuration.
 *
 * Package unit tests live next to their source as `*.test.ts` and import from
 * their own package using relative paths. Cross-package (`@dla/*`) specifiers
 * are aliased to each package's source entry so integration-style tests under
 * `tests/` (which the root package does not directly depend on) can resolve
 * them. The Next.js app is typechecked and built separately.
 */
const dla = (name: string) =>
  fileURLToPath(new URL(`./packages/${name}/src/index.ts`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@dla/archive': dla('archive'),
      '@dla/connectors': dla('connectors'),
      '@dla/database': dla('database'),
      '@dla/i18n': dla('i18n'),
      '@dla/import': dla('import'),
      '@dla/oauth': dla('oauth'),
      '@dla/security': dla('security'),
      '@dla/shared': dla('shared'),
      '@dla/storage': dla('storage'),
      '@dla/ui': dla('ui'),
    },
  },
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
