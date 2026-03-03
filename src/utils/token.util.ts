import crypto from 'crypto';
import { CONFIRMATION_TOKEN_BYTES, CONFIRMATION_TOKEN_EXPIRY_MS } from './constants';

export function generateConfirmationToken(): {
  token: string;
  hashedToken: string;
  expiresAt: Date;
} {
  const token = crypto.randomBytes(CONFIRMATION_TOKEN_BYTES).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + CONFIRMATION_TOKEN_EXPIRY_MS);

  return { token, hashedToken, expiresAt };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
