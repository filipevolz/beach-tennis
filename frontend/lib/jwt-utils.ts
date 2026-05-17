export function getJwtExpiryMs(token: string): number | null {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const payload = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'))) as {
      exp?: number;
    };
    if (typeof payload.exp !== 'number') return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export function shouldRefreshToken(token: string, skewMs = 60_000): boolean {
  const expiry = getJwtExpiryMs(token);
  if (!expiry) return true;
  return Date.now() >= expiry - skewMs;
}
