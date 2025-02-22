import * as crypto from 'crypto';
import { isUid, generateUid } from './uid';

export function getCSRFToken(): string {
  const salt = generateUid();
  const hash = crypto
    .createHash('sha256')
    .update(salt)
    .update(process.env.SECRET_KEY!)
    .digest('hex');
  return `${salt}.${hash}`;
}

export function validateCSRFToken(token: string): boolean {
  const [salt, hash] = token.split('.');
  if (!salt || !hash || !isUid(salt)) {
    return false;
  }
  const expectedHash = crypto
    .createHash('sha256')
    .update(salt)
    .update(process.env.SECRET_KEY!)
    .digest('hex');
  return hash === expectedHash;
}
