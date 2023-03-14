import crypto from 'crypto';

export function uid() {
  return crypto.randomBytes(16).toString('hex');
}
