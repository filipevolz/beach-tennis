import type { ApiClient } from '@/lib/api-client';
import type { PlayerProfile } from '@/lib/api-types';

export interface UpdatePlayerProfileInput {
  displayName?: string;
  skillLevel?: string;
  latitude?: number;
  longitude?: number;
  bio?: string;
}

export function createPlayerApi(client: ApiClient) {
  return {
    async getMyProfile(): Promise<PlayerProfile> {
      return client.request<PlayerProfile>('/players/me');
    },

    async updateMyProfile(input: UpdatePlayerProfileInput): Promise<PlayerProfile> {
      return client.request<PlayerProfile>('/players/me', {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },
  };
}

export type PlayerApi = ReturnType<typeof createPlayerApi>;
