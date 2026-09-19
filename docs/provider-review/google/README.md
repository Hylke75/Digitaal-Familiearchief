# Google OAuth / restricted-scope review pack — Bewora

_Prepare this before submitting Google OAuth production verification + restricted-
scope review (required for full Drive archival via `drive.readonly`)._

## Product description

Bewora is a consumer digital-life archive. Users connect Google Drive to keep an
independent backup of their own files, preserving their existing history and new
files automatically. Bewora never modifies or deletes the user's Google Drive
content.

## Use case & requested scopes

| Scope | Why it is necessary |
|---|---|
| `https://www.googleapis.com/auth/drive.readonly` | Read the user's Drive to archive an independent copy of their own files (full historical + incremental). This is the minimum scope that enables the product's core promise (full archival). |
| `openid`, `email`, `profile` | Identify the connected Google account for display and account matching. |

We do **not** request write scopes (Bewora never changes the user's Drive).

## Data handling

- Files are copied into Bewora's private, per-user storage (EU region).
- OAuth tokens are encrypted at rest (AES-256-GCM), server-side only, never logged.
- Row Level Security isolates every user's data (default deny).
- Downloads use short-lived signed URLs.
- User content is not used for AI training.

## Deletion & disconnect behaviour

- Disconnecting Google Drive stops future archiving but **retains** already-archived
  content (the user's independent copy).
- If a file disappears from Drive, Bewora keeps its archived copy and records that
  the source copy is gone.
- The user can delete archived content and/or their account explicitly.

## URLs

- Homepage: `${NEXT_PUBLIC_APP_URL}`
- Privacy: `${NEXT_PUBLIC_APP_URL}/privacy`
- Terms: `${NEXT_PUBLIC_APP_URL}/terms`
- Redirect URI: `${NEXT_PUBLIC_APP_URL}/auth/google/callback`

## Screenshots to capture (from the running app)

1. `/` landing (value proposition).
2. `/bronnen` — Google Drive card with "Koppelen".
3. The Google consent screen (during connect).
4. `/bronnen/[id]` — connected source with status + disconnect explanation.
5. `/privacy` and `/security` pages.

## Security assessment

Full Drive access (`drive.readonly`) requires a yearly **CASA** assessment via a
Google-approved lab. See `docs/PROVIDER_SETUP.md` and
`docs/CONNECTOR_SECURITY_REVIEW.md`.
