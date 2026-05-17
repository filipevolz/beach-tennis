import { Court, Venue } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';
import { setVenueLocation } from '../../src/common/utils/geo';

export interface CreateVenueOptions {
  managerId: string;
  name?: string;
  latitude?: number;
  longitude?: number;
}

export async function createVenue(
  prisma: PrismaService,
  options: CreateVenueOptions,
): Promise<Venue> {
  const venue = await prisma.venue.create({
    data: {
      managerId: options.managerId,
      name: options.name ?? 'Test Venue',
      address: 'Test Address',
    },
  });

  await setVenueLocation(
    prisma,
    venue.id,
    options.latitude ?? -22.95,
    options.longitude ?? -43.18,
  );

  return venue;
}

export async function createCourt(
  prisma: PrismaService,
  venueId: string,
  name = 'Court 1',
): Promise<Court> {
  return prisma.court.create({
    data: { venueId, name },
  });
}
