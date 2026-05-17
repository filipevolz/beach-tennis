import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  AvailabilitySlotStatus,
  BookingStatus,
  MatchStatus,
  Prisma,
} from '@prisma/client';
import { BookingService } from './booking.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BookingService', () => {
  let service: BookingService;
  let prisma: {
    booking: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    match: { findUnique: jest.Mock; update: jest.Mock };
    availabilitySlot: { findUnique: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
    $transaction: jest.Mock;
  };

  const slot = {
    id: 'slot-1',
    status: AvailabilitySlotStatus.available,
  };

  const match = {
    id: 'match-1',
    creatorId: 'creator-1',
    status: MatchStatus.ready_to_book,
  };

  const booking = {
    id: 'booking-1',
    matchId: 'match-1',
    availabilitySlotId: 'slot-1',
    status: BookingStatus.pending,
    createdById: 'creator-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    availabilitySlot: slot,
    match,
  };

  beforeEach(() => {
    prisma = {
      booking: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      match: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      availabilitySlot: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    service = new BookingService(prisma as unknown as PrismaService);
  });

  it('confirm with available slot marks slot reserved and match booked', async () => {
    prisma.booking.findUnique.mockResolvedValue(booking);
    prisma.availabilitySlot.updateMany.mockResolvedValue({ count: 1 });
    prisma.booking.update.mockResolvedValue({
      ...booking,
      status: BookingStatus.confirmed,
    });

    const result = await service.confirm('booking-1', 'creator-1');

    expect(prisma.availabilitySlot.updateMany).toHaveBeenCalledWith({
      where: { id: 'slot-1', status: AvailabilitySlotStatus.available },
      data: { status: AvailabilitySlotStatus.reserved },
    });
    expect(prisma.match.update).toHaveBeenCalledWith({
      where: { id: 'match-1' },
      data: { status: MatchStatus.booked },
    });
    expect(result.status).toBe(BookingStatus.confirmed);
  });

  it('confirm with reserved slot returns 409 SLOT_NOT_AVAILABLE', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      ...booking,
      availabilitySlot: { ...slot, status: AvailabilitySlotStatus.reserved },
    });

    await expect(service.confirm('booking-1', 'creator-1')).rejects.toMatchObject({
      response: { code: 'SLOT_NOT_AVAILABLE' },
    });
  });

  it('confirm rejects non-creator with FORBIDDEN', async () => {
    prisma.booking.findUnique.mockResolvedValue(booking);

    await expect(service.confirm('booking-1', 'other-user')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('create rejects missing match', async () => {
    prisma.match.findUnique.mockResolvedValue(null);

    await expect(
      service.create('creator-1', 'match-1', 'slot-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create rejects missing slot', async () => {
    prisma.match.findUnique.mockResolvedValue(match);
    prisma.availabilitySlot.findUnique.mockResolvedValue(null);

    await expect(
      service.create('creator-1', 'match-1', 'slot-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create rejects unavailable slot', async () => {
    prisma.match.findUnique.mockResolvedValue(match);
    prisma.availabilitySlot.findUnique.mockResolvedValue({
      ...slot,
      status: AvailabilitySlotStatus.reserved,
    });

    await expect(
      service.create('creator-1', 'match-1', 'slot-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('create maps unique violation to SLOT_NOT_AVAILABLE', async () => {
    prisma.match.findUnique.mockResolvedValue(match);
    prisma.availabilitySlot.findUnique.mockResolvedValue(slot);
    const error = new Prisma.PrismaClientKnownRequestError('Unique', {
      code: 'P2002',
      clientVersion: 'test',
    });
    prisma.booking.create.mockRejectedValue(error);

    await expect(
      service.create('creator-1', 'match-1', 'slot-1'),
    ).rejects.toMatchObject({
      response: { code: 'SLOT_NOT_AVAILABLE' },
    });
  });

  it('confirm throws when booking is missing', async () => {
    prisma.booking.findUnique.mockResolvedValue(null);

    await expect(service.confirm('missing', 'creator-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('create persists a pending booking for an available slot', async () => {
    prisma.match.findUnique.mockResolvedValue(match);
    prisma.availabilitySlot.findUnique.mockResolvedValue(slot);
    prisma.booking.create.mockResolvedValue(booking);

    const result = await service.create('creator-1', 'match-1', 'slot-1');

    expect(result.status).toBe(BookingStatus.pending);
    expect(prisma.booking.create).toHaveBeenCalled();
  });

  it('cancel deletes a pending booking', async () => {
    prisma.booking.findUnique.mockResolvedValue(booking);
    prisma.booking.delete.mockResolvedValue(booking);

    await service.cancel('booking-1', 'creator-1');

    expect(prisma.booking.delete).toHaveBeenCalledWith({ where: { id: 'booking-1' } });
  });

  it('confirm fails when optimistic slot update loses the race', async () => {
    prisma.booking.findUnique.mockResolvedValue(booking);
    prisma.availabilitySlot.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.confirm('booking-1', 'creator-1')).rejects.toMatchObject({
      response: { code: 'SLOT_NOT_AVAILABLE' },
    });
  });

  it('cancel on confirmed booking frees slot and match status', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      ...booking,
      status: BookingStatus.confirmed,
      availabilitySlot: { ...slot, status: AvailabilitySlotStatus.reserved },
    });

    await service.cancel('booking-1', 'creator-1');

    expect(prisma.availabilitySlot.update).toHaveBeenCalledWith({
      where: { id: 'slot-1' },
      data: { status: AvailabilitySlotStatus.available },
    });
    expect(prisma.match.update).toHaveBeenCalledWith({
      where: { id: 'match-1' },
      data: { status: MatchStatus.ready_to_book },
    });
    expect(prisma.booking.delete).toHaveBeenCalled();
  });

  it('cancel rejects users who are neither creator nor booking author', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      ...booking,
      createdById: 'other',
      match: { ...match, creatorId: 'another' },
    });

    await expect(service.cancel('booking-1', 'stranger')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('confirm returns existing booking when already confirmed', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      ...booking,
      status: BookingStatus.confirmed,
    });

    const result = await service.confirm('booking-1', 'creator-1');
    expect(result.status).toBe(BookingStatus.confirmed);
    expect(prisma.availabilitySlot.updateMany).not.toHaveBeenCalled();
  });
});
