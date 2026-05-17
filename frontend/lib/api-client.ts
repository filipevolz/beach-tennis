import { parseApiErrorResponse } from './api-errors';

const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register'] as const;

export type GetAccessToken = () => string | null;
export type RefreshAccessToken = () => Promise<string | null>;

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken: GetAccessToken;
  refreshAccessToken: RefreshAccessToken;
}

export function isPublicAuthPath(path: string): boolean {
  return PUBLIC_AUTH_PATHS.some((publicPath) => path.startsWith(publicPath));
}

export function createApiClient(options: ApiClientOptions) {
  const { baseUrl, getAccessToken, refreshAccessToken } = options;

  async function buildHeaders(
    path: string,
    initHeaders?: HeadersInit,
    accessTokenOverride?: string | null,
  ): Promise<Headers> {
    const headers = new Headers(initHeaders);
    if (!headers.has('Content-Type') && initHeaders === undefined) {
      headers.set('Content-Type', 'application/json');
    }

    if (!isPublicAuthPath(path)) {
      const token = accessTokenOverride ?? getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  async function request<T>(
    path: string,
    init?: RequestInit,
    retryOnUnauthorized = true,
    accessTokenOverride?: string | null,
  ): Promise<T> {
    const headers = await buildHeaders(path, init?.headers, accessTokenOverride);
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (
      response.status === 401 &&
      retryOnUnauthorized &&
      !isPublicAuthPath(path) &&
      path !== '/auth/refresh'
    ) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return request<T>(path, init, false, newToken);
      }
    }

    if (!response.ok) {
      throw await parseApiErrorResponse(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  return { request, isPublicAuthPath };
}

export type ApiClient = ReturnType<typeof createApiClient>;
