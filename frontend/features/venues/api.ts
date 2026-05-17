import type { ApiClient } from '@/lib/api-client';
import type { Venue, Court, AvailabilitySlot } from '@/lib/api-types';

export interface CreateVenueInput {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  description?: string;
}

export interface UpdateVenueInput {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
}

export interface CreateCourtInput {
  name: string;
  surface?: string;
}

export interface PublishSlotInput {
  courtId: string;
  startsAt: string;
  endsAt: string;
  priceCents?: number;
}

export interface UpdateSlotInput {
  status?: 'available' | 'cancelled';
}

export interface ListSlotsQuery {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  from?: string;
  to?: string;
  status?: string;
}

export function createVenueApi(client: ApiClient) {
  return {
    async createVenue(input: CreateVenueInput): Promise<Venue> {
      return client.request<Venue>('/venues', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async getMyVenue(): Promise<Venue> {
      return client.request<Venue>('/venues/me');
    },

    async updateVenue(id: string, input: UpdateVenueInput): Promise<Venue> {
      return client.request<Venue>(`/venues/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },

    async addCourt(venueId: string, input: CreateCourtInput): Promise<Court> {
      return client.request<Court>(`/venues/${venueId}/courts`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async listCourts(venueId: string): Promise<Court[]> {
      return client.request<Court[]>(`/venues/${venueId}/courts`);
    },

    async publishSlot(venueId: string, input: PublishSlotInput): Promise<AvailabilitySlot> {
      return client.request<AvailabilitySlot>(`/venues/${venueId}/availability-slots`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async listSlots(query: ListSlotsQuery = {}): Promise<AvailabilitySlot[]> {
      const params = new URLSearchParams();
      if (query.lat != null) params.set('lat', String(query.lat));
      if (query.lng != null) params.set('lng', String(query.lng));
      if (query.radiusKm != null) params.set('radiusKm', String(query.radiusKm));
      if (query.from) params.set('from', query.from);
      if (query.to) params.set('to', query.to);
      if (query.status) params.set('status', query.status);
      const qs = params.toString();
      return client.request<AvailabilitySlot[]>(`/availability-slots${qs ? `?${qs}` : ''}`);
    },

    async updateSlot(slotId: string, input: UpdateSlotInput): Promise<AvailabilitySlot> {
      return client.request<AvailabilitySlot>(`/availability-slots/${slotId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },
  };
}

export type VenueApi = ReturnType<typeof createVenueApi>;
