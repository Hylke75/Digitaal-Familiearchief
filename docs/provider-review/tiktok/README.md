# TikTok Data Portability API review pack — Bewora

_Prepare this before submitting TikTok's Data Portability API privacy + security
review. The API serves EEA/UK users only._

## Product description

Bewora is a consumer digital-life archive. Users connect TikTok to keep an
independent copy of their own posts and media, using TikTok's official Data
Portability API. Bewora never posts, modifies or deletes anything on TikTok.

## Use case & requested scopes

- Request the user's **posts, profile information and media** for archival.
- We do **NOT** request **direct messages** unless separately approved by the
  product owner for a clear, disclosed reason.
- EEA/UK users only; Bewora distinguishes eligible users before offering the connect.

## Flow

Login Kit → consent → request portability export → background wait → webhook/poll →
download official export server-side → parse posts/media → archive (dedup by
SHA-256) → repeat per user frequency and provider limits.

Ongoing exports may return the full dataset; Bewora deduplicates by content hash and
only records new/changed source relationships — never duplicate media objects.

## Data handling

- Stored in Bewora's private, per-user EU storage; tokens encrypted at rest.
- RLS isolation; short-lived signed URLs; no AI training on user content.

## Deletion & disconnect

- Disconnecting stops future exports but retains archived content.
- Explicit user action required to delete archived content / account.

## URLs

- Homepage / Privacy / Terms: `${NEXT_PUBLIC_APP_URL}`, `/privacy`, `/terms`
- Redirect URI: `${NEXT_PUBLIC_APP_URL}/auth/tiktok/callback`
- Webhook (if used): `${NEXT_PUBLIC_APP_URL}/api/webhooks/tiktok`

## UX mockups / screenshots to capture

1. `/bronnen` — TikTok card.
2. Connect + consent flow.
3. "Bezig met veiligstellen" progress state.
4. Connected source detail + disconnect explanation.
5. `/privacy`.
