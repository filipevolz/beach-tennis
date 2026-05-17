'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createApiClient, type ApiClient } from './api-client';
import { useAuth } from '@/features/auth/auth-context';

const ApiContext = createContext<ApiClient | null>(null);

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
}

export function ApiProvider({ children }: { children: ReactNode }) {
  const { getAccessToken } = useAuth();

  const apiClient = useMemo(
    () =>
      createApiClient({
        baseUrl: getApiBaseUrl(),
        getAccessToken,
        refreshAccessToken: async () => {
          const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'same-origin',
          });
          if (!res.ok) return null;
          const data = (await res.json()) as { accessToken: string };
          return data.accessToken;
        },
      }),
    [getAccessToken],
  );

  return <ApiContext.Provider value={apiClient}>{children}</ApiContext.Provider>;
}

export function useApiClient(): ApiClient {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error('useApiClient must be used within ApiProvider');
  return ctx;
}
