import { describe, expect, it } from 'vitest';
import { getJwtExpiryMs, shouldRefreshToken } from './jwt-utils';

function makeToken(expSeconds: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ exp: expSeconds }));
  return `${header}.${payload}.signature`;
}

describe('jwt-utils', () => {
  it('reads expiry from token', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    expect(getJwtExpiryMs(makeToken(exp))).toBe(exp * 1000);
  });

  it('detects when refresh is needed', () => {
    const exp = Math.floor(Date.now() / 1000) + 10;
    expect(shouldRefreshToken(makeToken(exp), 60_000)).toBe(true);
  });

  it('returns null for malformed tokens', () => {
    expect(getJwtExpiryMs('not-a-jwt')).toBeNull();
    expect(shouldRefreshToken('not-a-jwt')).toBe(true);
  });
});
