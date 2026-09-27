# Demo seed & run

The Bewora demo runs in **file-backed mode**: the app reads seeded JSON from
`/data/demo` and serves images from `apps/web/public/demo/photos`. No database,
no Supabase user, no writes to production. It works with just `pnpm dev`.

## Exact commands

```bash
# 1. Install dependencies
pnpm install

# 2. Seed the demo (generates /data/demo/*.json + placeholder images).
#    Idempotent & deterministic — safe to run any time.
pnpm seed:demo

# 3. Run the app
pnpm dev

# 4. Open the demo
#    Visit http://localhost:3000/demo
#    → sets a `bewora_demo` cookie and opens /vandaag as the demo archive.
#    Leave the demo any time via the "Demo verlaten" link (or /demo?exit=1).
```

There is **no login** for the demo — `/demo` is a safe, dev/showcase session.
It never exposes or reuses any developer credentials, and it never touches the
production Supabase project.

## Reset

```bash
pnpm seed:demo:reset
```

In file-backed mode this cleanly regenerates the demo content (a deterministic
reconcile). It only ever rewrites files under `/data/demo` and
`apps/web/public/demo`; it never removes production/user data.

## Adding the real photos later

The 30 photorealistic prompts are in `data/demo/demo-image-prompts.md`. Generate
each image, drop it into `apps/web/public/demo/photos/` using the **exact
filename**, then:

```bash
pnpm seed:demo    # refreshes the media manifest
```

The resolver (`resolveDemoMediaUrl`) now serves the real `.jpg`; until then it
serves the generated Bewora-styled `.svg` placeholder. No code change needed.

## Migrations & the (optional) Supabase path

The demo does **not** require any migration. Migration
`supabase/migrations/0009_demo_archive_experience.sql` is authored for the
optional future path where the demo lives in a **dedicated** Supabase project;
it is intentionally left **unapplied**. Do not apply it against production. A DB
seeder for that optional path is not shipped in file-backed mode — the
`/data/demo/*.json` files map 1:1 onto the `0009` tables (see
[ARCHIVE_DATA_MODEL.md](./ARCHIVE_DATA_MODEL.md)) if you later build it against a
dedicated demo project.

| Task            | Command                    |
| --------------- | -------------------------- |
| Install         | `pnpm install`             |
| Seed demo       | `pnpm seed:demo`           |
| Run             | `pnpm dev`                 |
| Open demo       | visit `/demo`              |
| Leave demo      | visit `/demo?exit=1`       |
| Reset demo      | `pnpm seed:demo:reset`     |
| Regen images    | `pnpm seed:demo:placeholders` |
