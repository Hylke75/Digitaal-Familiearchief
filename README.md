# Bewora

**"Alles wat je niet kwijt wilt. Op één veilige plek."** · _Keep what matters._

Bewora is a consumer digital-life archive: connect the places where your digital
life already lives once; Bewora imports your existing history and keeps preserving
new content automatically where provider APIs allow it. Your archive stays yours —
independent of the original platforms — and can eventually be passed to people you
choose.

> See [`CLAUDE.md`](./CLAUDE.md) for the product + engineering spec,
> [`docs/DESIGN.md`](./docs/DESIGN.md) for the UX/UI system,
> [`docs/CONNECTORS_BUILD.md`](./docs/CONNECTORS_BUILD.md) for the connector spec,
> and [`docs/PROVIDER_SETUP.md`](./docs/PROVIDER_SETUP.md) for owner setup steps.

## Tech stack

- **Monorepo**: pnpm workspaces (`apps/*`, `packages/*`)
- **App**: Next.js 14 (App Router) · React 18 · TypeScript (strict) · Tailwind CSS
- **i18n**: next-intl (nl-NL default, en) fed from `@dla/i18n`
- **Backend**: Supabase (PostgreSQL, Auth, RLS, Storage, Edge Functions) — EU region
- **CI**: GitHub Actions (format · lint · typecheck · test · build · audit)

## Repository layout

```
apps/web                Next.js consumer app
apps/mobile-placeholder reserved (no mobile app yet)
packages/shared         cross-cutting types + utils
packages/i18n           locales + nl/en dictionaries
packages/database       generated DB types (placeholder in Phase 0)
packages/storage        ArchiveStorageProvider abstraction + in-memory impl
packages/connectors     ArchiveConnector interface + capability registry
packages/archive        provider-independent domain model + checksum/dedup
packages/security       audit types, token-encryption interface, redaction
packages/ui             shared UI helpers
supabase/               config, migrations, functions, seed
docs/                   architecture, database, connectors, security, privacy, storage, decisions, api
tests/fixtures          synthetic-only fixtures
```

## Prerequisites

- Node.js 20+ (see [`.nvmrc`](./.nvmrc))
- pnpm 9 (`corepack use pnpm@9` or `npm i -g pnpm@9`)

## Getting started

```bash
pnpm install

# Configure environment
cp .env.example apps/web/.env.local
# then fill in the Supabase values (URL + publishable/anon key)

pnpm dev          # start the web app on http://localhost:3000
```

## Scripts (run from the repo root)

| Command | Description |
|---|---|
| `pnpm dev` | Run the Next.js app in development |
| `pnpm build` | Production build of the app |
| `pnpm lint` | ESLint across the workspace |
| `pnpm typecheck` | TypeScript check (packages + app) |
| `pnpm test` | Vitest unit tests |
| `pnpm format` / `pnpm format:check` | Prettier write / check |

## Environment

Copy [`.env.example`](./.env.example) to `apps/web/.env.local`. Required public
variables are validated at startup (`apps/web/lib/env.ts`). Never commit secrets;
the Supabase **service-role** key is server-only and must never reach the browser.

## Contributing workflow

`main` (protected) · `develop` (integration) · `feature/*` · `fix/*` ·
`security/*`. Branch → implement → test → document → PR. CI must pass before merge.

## Security & privacy

Security is a P0 concern (RLS default-deny, server-only service role, encrypted
provider tokens, audit logging, EU processing). See
[`docs/security.md`](./docs/security.md) and [`docs/privacy.md`](./docs/privacy.md).
