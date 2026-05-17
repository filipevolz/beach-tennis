import type { ApiClient } from '@/lib/api-client';
import type { Booking } from '@/lib/api-types';

export interface CreateBookingInput {
  matchId: string;
  availabilitySlotId: string;
}

export function createBookingApi(client: ApiClient) {
  return {
    async createBooking(input: CreateBookingInput): Promise<Booking> {
      return client.request<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async confirmBooking(bookingId: string): Promise<Booking> {
      return client.request<Booking>(`/bookings/${bookingId}/confirm`, {
        method: 'POST',
      });
    },

    async cancelBooking(bookingId: string): Promise<void> {
      return client.request<void>(`/bookings/${bookingId}`, {
        method: 'DELETE',
      });
    },
  };
}

export type BookingApi = ReturnType<typeof createBookingApi>;
