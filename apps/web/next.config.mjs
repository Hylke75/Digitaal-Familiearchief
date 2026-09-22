import path from 'node:path';
import { fileURLToPath } from 'node:url';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Baseline secure headers (CLAUDE.md §42). The CSP is intentionally strict and
 * will be extended per-connector in later phases.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source and are compiled by Next.
  transpilePackages: [
    '@dla/shared',
    '@dla/i18n',
    '@dla/import',
    '@dla/oauth',
    '@dla/database',
    '@dla/storage',
    '@dla/connectors',
    '@dla/archive',
    '@dla/security',
    '@dla/ui',
  ],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  experimental: {
    // Bundle the ffmpeg-static binary with the cron worker so it can extract
    // video poster frames at runtime (it's referenced by path, not statically
    // imported, so Next's tracer needs an explicit include). Pin the tracing
    // root to the monorepo root so the pnpm store path resolves.
    outputFileTracingRoot: repoRoot,
    outputFileTracingIncludes: {
      '/api/archive/tick': [
        'node_modules/ffmpeg-static/ffmpeg',
        'node_modules/.pnpm/ffmpeg-static@*/node_modules/ffmpeg-static/ffmpeg',
      ],
    },
  },
};

export default withNextIntl(nextConfig);
