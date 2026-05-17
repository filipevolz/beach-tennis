import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiClient, isPublicAuthPath } from './api-client';

describe('isPublicAuthPath', () => {
  it('identifies public auth routes', () => {
    expect(isPublicAuthPath('/auth/login')).toBe(true);
    expect(isPublicAuthPath('/auth/register')).toBe(true);
    expect(isPublicAuthPath('/players/me')).toBe(false);
  });
});

describe('createApiClient', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('attaches Authorization when access token is present', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const client = createApiClient({
      baseUrl: 'http://api.test/api/v1',
      getAccessToken: () => 'access-123',
      refreshAccessToken: async () => null,
    });

    await client.request('/players/me');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBe('Bearer access-123');
  });

  it('does not attach Authorization on public auth routes', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const client = createApiClient({
      baseUrl: 'http://api.test/api/v1',
      getAccessToken: () => 'access-123',
      refreshAccessToken: async () => null,
    });

    await client.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: 'secret12' }),
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBeNull();
  });

  it('refreshes token and retries after 401', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ displayName: 'Ana' }), { status: 200 }),
      );

    const refreshAccessToken = vi.fn(async () => 'fresh-token');

    const client = createApiClient({
      baseUrl: 'http://api.test/api/v1',
      getAccessToken: () => 'stale-token',
      refreshAccessToken,
    });

    const result = await client.request<{ displayName: string }>('/players/me');
    expect(refreshAccessToken).toHaveBeenCalledOnce();
    expect(result.displayName).toBe('Ana');

    const retryCall = fetchMock.mock.calls[1] as [string, RequestInit];
    const retryHeaders = new Headers(retryCall[1].headers);
    expect(retryHeaders.get('Authorization')).toBe('Bearer fresh-token');
  });
});
