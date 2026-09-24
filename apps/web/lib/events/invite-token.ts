import { createHash } from 'node:crypto';
import { randomToken } from '@dla/security';

/**
 * Uitnodigingstokens: we delen het token met de gast maar bewaren alleen de
 * hash in de database (§C — nooit het token zelf). Bij binnenkomst hashen we het
 * geplakte token opnieuw en zoeken op de hash. sha256 is genoeg omdat het token
 * zelf al hoge entropie heeft (geen wachtwoord).
 */
export function newInviteToken(): { token: string; tokenHash: string } {
  const token = randomToken(24);
  return { token, tokenHash: hashInviteToken(token) };
}

export function hashInviteToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex');
}
