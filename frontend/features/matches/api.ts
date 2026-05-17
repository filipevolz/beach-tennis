import type { ApiClient } from '@/lib/api-client';
import type { Match, MatchSpot, MatchFormat, MatchVisibility } from '@/lib/api-types';

export interface CreateMatchInput {
  format: MatchFormat;
  visibility: MatchVisibility;
  skillLevel: string;
  latitude: number;
  longitude: number;
  notes?: string;
}

export interface DiscoveryQuery {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  format?: MatchFormat;
  skillLevel?: string;
  page?: number;
  pageSize?: number;
}

export function createMatchApi(client: ApiClient) {
  return {
    async createMatch(input: CreateMatchInput): Promise<Match> {
      return client.request<Match>('/matches', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async listPublicMatches(query: DiscoveryQuery = {}): Promise<Match[]> {
      const params = new URLSearchParams();
      if (query.lat != null) params.set('lat', String(query.lat));
      if (query.lng != null) params.set('lng', String(query.lng));
      if (query.radiusKm != null) params.set('radiusKm', String(query.radiusKm));
      if (query.format) params.set('format', query.format);
      if (query.skillLevel) params.set('skillLevel', query.skillLevel);
      if (query.page != null) params.set('page', String(query.page));
      if (query.pageSize != null) params.set('pageSize', String(query.pageSize));
      const qs = params.toString();
      return client.request<Match[]>(`/matches${qs ? `?${qs}` : ''}`);
    },

    async getMatchByInviteCode(code: string): Promise<Match> {
      return client.request<Match>(`/matches/invite/${code}`);
    },

    async getMatch(id: string): Promise<Match> {
      return client.request<Match>(`/matches/${id}`);
    },

    async joinSpot(matchId: string): Promise<MatchSpot> {
      return client.request<MatchSpot>(`/matches/${matchId}/spots/join`, {
        method: 'POST',
      });
    },

    async leaveSpot(matchId: string): Promise<void> {
      return client.request<void>(`/matches/${matchId}/spots/leave`, {
        method: 'POST',
      });
    },
  };
}

export type MatchApi = ReturnType<typeof createMatchApi>;
