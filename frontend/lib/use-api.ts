'use client';

import { useMemo } from 'react';
import { createApiClient } from './api-client';
import { useAuth } from '@/features/auth/auth-context';
import { createVenueApi } from '@/features/venues/api';
import { createMatchApi } from '@/features/matches/api';
import { createBookingApi } from '@/features/bookings/api';
import { createPlayerApi } from '@/features/players/api';

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
}

async function refreshAccessFromCookie(): Promise<string | null> {
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'same-origin',
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { accessToken: string };
  return data.accessToken;
}

export function useApi() {
  const { getAccessToken } = useAuth();

  const client = useMemo(
    () =>
      createApiClient({
        baseUrl: getApiBaseUrl(),
        getAccessToken,
        refreshAccessToken: refreshAccessFromCookie,
      }),
    [getAccessToken],
  );

  return useMemo(
    () => ({
      venues: createVenueApi(client),
      matches: createMatchApi(client),
      bookings: createBookingApi(client),
      players: createPlayerApi(client),
    }),
    [client],
  );
}
