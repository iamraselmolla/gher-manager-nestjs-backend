import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const SALT_ROUNDS = 12;

/**
 * bcryptjs (pure JS) is used intentionally instead of `bcrypt` — the native
 * `bcrypt` package needs a compiled binary per platform, which is exactly
 * the class of problem we hit with Prisma's engine binaries. bcryptjs avoids
 * that entirely at a small, acceptable performance cost.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Generates a human-typeable default password for admin-created accounts
 * (Editors) and auto-created investor accounts, e.g. "GH-7F3K-9QXZ".
 * Shown once to whoever created the account; the recipient must change it
 * on first login (`User.mustChangePassword`).
 */
export function generateDefaultPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity
  const chunk = (len: number) =>
    Array.from(randomBytes(len))
      .map((b) => alphabet[b % alphabet.length])
      .join('');
  return `GH-${chunk(4)}-${chunk(4)}`;
}
