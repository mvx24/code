import * as crypto from 'crypto';

const uidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export function generateUid() {
  return crypto.randomUUID();
}

export function isUid(id: string): boolean {
  return uidRegex.test(id);
}
