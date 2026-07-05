import { createHash, randomBytes } from 'crypto';

/**
 * Refresh tokens and password-reset tokens are handed to the client as a
 * random opaque string; only a SHA-256 hash of that string is ever stored in
 * the database. This means a leaked database backup does not, by itself,
 * hand over usable session/reset tokens.
 */
export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
