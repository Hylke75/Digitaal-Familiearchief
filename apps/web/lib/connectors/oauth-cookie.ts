/**
 * Name of the short-lived cookie that carries the OAuth flow state between the
 * connector `start` and `callback` routes. Kept in its own module because a
 * Next.js route file may only export route handlers — not shared constants.
 */
export const OAUTH_COOKIE = 'bewora_oauth';
