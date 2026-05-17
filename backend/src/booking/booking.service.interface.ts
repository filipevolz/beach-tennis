import { BookingStatus } from '@prisma/client';

export interface BookingDto {
  id: string;
  matchId: string;
  availabilitySlotId: string;
  status: BookingStatus;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookingService {
  create(userId: string, matchId: string, availabilitySlotId: string): Promise<BookingDto>;
  confirm(bookingId: string, userId: string): Promise<BookingDto>;
  cancel(bookingId: string, userId: string): Promise<void>;
}
