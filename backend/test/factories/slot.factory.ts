import { AvailabilitySlot, AvailabilitySlotStatus } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';

export async function createAvailabilitySlot(
  prisma: PrismaService,
  courtId: string,
  startsAt = new Date(Date.now() + 24 * 60 * 60 * 1000),
  endsAt = new Date(Date.now() + 25 * 60 * 60 * 1000),
): Promise<AvailabilitySlot> {
  return prisma.availabilitySlot.create({
    data: {
      courtId,
      startsAt,
      endsAt,
      status: AvailabilitySlotStatus.available,
    },
  });
}
