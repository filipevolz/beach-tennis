// Shared domain types used across features

export type UserRole = 'player' | 'venue_manager';
export type MatchFormat = 'singles' | 'doubles';
export type MatchVisibility = 'public' | 'invite';
export type MatchStatus = 'forming' | 'open' | 'ready_to_book' | 'booked' | 'cancelled';
export type SpotStatus = 'open' | 'filled';
export type SlotStatus = 'available' | 'reserved' | 'cancelled';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Player
export interface PlayerProfile {
  id: string;
  userId: string;
  displayName: string;
  skillLevel: string;
  latitude?: number | null;
  longitude?: number | null;
  bio?: string | null;
}

// Venue
export interface Venue {
  id: string;
  managerId: string;
  name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
}

export interface Court {
  id: string;
  venueId: string;
  name: string;
  surface?: string | null;
}

// Availability
export interface AvailabilitySlot {
  id: string;
  courtId: string;
  court?: Court;
  venue?: Venue;
  startsAt: string;
  endsAt: string;
  status: SlotStatus;
  priceCents?: number | null;
}

// Match
export interface MatchSpot {
  id: string;
  matchId: string;
  playerId?: string | null;
  status: SpotStatus;
  position: number;
}

export interface Match {
  id: string;
  creatorId: string;
  format: MatchFormat;
  visibility: MatchVisibility;
  inviteCode?: string | null;
  skillLevel: string;
  latitude?: number | null;
  longitude?: number | null;
  status: MatchStatus;
  notes?: string | null;
  spots: MatchSpot[];
  createdAt: string;
}

// Booking
export interface Booking {
  id: string;
  matchId: string;
  availabilitySlotId: string;
  status: BookingStatus;
  createdById: string;
  slot?: AvailabilitySlot;
}
