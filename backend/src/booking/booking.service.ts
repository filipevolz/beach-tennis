import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AvailabilitySlotStatus,
  Booking,
  BookingStatus,
  MatchStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BookingDto, IBookingService } from './booking.service.interface';

@Injectable()
export class BookingService implements IBookingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    matchId: string,
    availabilitySlotId: string,
  ): Promise<BookingDto> {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException({
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
      });
    }

    const slot = await this.prisma.availabilitySlot.findUnique({
      where: { id: availabilitySlotId },
    });

    if (!slot) {
      throw new NotFoundException({
        code: 'SLOT_NOT_FOUND',
        message: 'Availability slot not found',
      });
    }

    if (slot.status !== AvailabilitySlotStatus.available) {
      throw new ConflictException({
        code: 'SLOT_NOT_AVAILABLE',
        message: 'Availability slot is not available',
      });
    }

    try {
      const booking = await this.prisma.booking.create({
        data: {
          matchId,
          availabilitySlotId,
          createdById: userId,
          status: BookingStatus.pending,
        },
      });
      return this.toDto(booking);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          code: 'SLOT_NOT_AVAILABLE',
          message: 'Availability slot already has a booking',
        });
      }
      throw error;
    }
  }

  async confirm(bookingId: string, userId: string): Promise<BookingDto> {
    try {
      const booking = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.booking.findUnique({
          where: { id: bookingId },
          include: { availabilitySlot: true, match: true },
        });

        if (!existing) {
          throw new NotFoundException({
            code: 'BOOKING_NOT_FOUND',
            message: 'Booking not found',
          });
        }

        if (existing.match.creatorId !== userId) {
          throw new ForbiddenException({
            code: 'FORBIDDEN',
            message: 'Only the match creator can confirm bookings',
          });
        }

        if (existing.status === BookingStatus.confirmed) {
          throw new ConflictException({
            code: 'SLOT_NOT_AVAILABLE',
            message: 'Booking is already confirmed',
          });
        }

        if (existing.availabilitySlot.status !== AvailabilitySlotStatus.available) {
          throw new ConflictException({
            code: 'SLOT_NOT_AVAILABLE',
            message: 'Availability slot is not available',
          });
        }

        const slotUpdate = await tx.availabilitySlot.updateMany({
          where: {
            id: existing.availabilitySlotId,
            status: AvailabilitySlotStatus.available,
          },
          data: { status: AvailabilitySlotStatus.reserved },
        });

        if (slotUpdate.count === 0) {
          throw new ConflictException({
            code: 'SLOT_NOT_AVAILABLE',
            message: 'Availability slot is not available',
          });
        }

        const confirmed = await tx.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.confirmed },
        });

        await tx.match.update({
          where: { id: existing.matchId },
          data: { status: MatchStatus.booked },
        });

        return confirmed;
      });

      return this.toDto(booking);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          code: 'SLOT_NOT_AVAILABLE',
          message: 'Availability slot is not available',
        });
      }
      throw error;
    }
  }

  async cancel(bookingId: string, userId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { availabilitySlot: true, match: true },
    });

    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Booking not found',
      });
    }

    if (booking.createdById !== userId && booking.match.creatorId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You cannot cancel this booking',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      if (booking.status === BookingStatus.confirmed) {
        await tx.availabilitySlot.update({
          where: { id: booking.availabilitySlotId },
          data: { status: AvailabilitySlotStatus.available },
        });
        await tx.match.update({
          where: { id: booking.matchId },
          data: { status: MatchStatus.ready_to_book },
        });
      }

      await tx.booking.delete({ where: { id: bookingId } });
    });
  }

  private toDto(booking: Booking): BookingDto {
    return {
      id: booking.id,
      matchId: booking.matchId,
      availabilitySlotId: booking.availabilitySlotId,
      status: booking.status,
      createdById: booking.createdById,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }
}
