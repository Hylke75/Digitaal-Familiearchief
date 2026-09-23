import path from 'node:path';
import { fileURLToPath } from 'node:url';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

// A single origin hosts Supabase (storage previews, auth, realtime); derive it
// from the public URL so the CSP follows the environment instead of a hardcoded
// project ref. Signed storage URLs (img-src) and the auth/realtime endpoints
// (connect-src, incl. wss for realtime) both live under this origin.
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').origin;
  } catch {
    return '';
  }
})();
const supabaseWs = supabaseOrigin.replace(/^https:/, 'wss:');

// Content-Security-Policy (CLAUDE.md §42). 'unsafe-inline' on script-src is
// still required by Next.js' inline bootstrap/hydration scripts; it is dropped
// once those move to nonces. style-src keeps 'unsafe-inline' for injected
// styles. Everything else is same-origin only.
const csp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'none'`,
  `form-action 'self'`,
  `img-src 'self' data: blob: ${supabaseOrigin}`.trim(),
  `media-src 'self' blob: ${supabaseOrigin}`.trim(),
  `font-src 'self' data:`,
  `style-src 'self' 'unsafe-inline'`,
  `script-src 'self' 'unsafe-inline'`,
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs}`.trim(),
  `upgrade-insecure-requests`,
]
  .filter(Boolean)
  .join('; ');

/**
 * Baseline secure headers (CLAUDE.md §42), now including a real
 * Content-Security-Policy. Extended per-connector in later phases.
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
  { key: 'Content-Security-Policy', value: csp },
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
