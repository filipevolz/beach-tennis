import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { VenueService } from './venue.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('../common/utils/geo', () => ({
  setVenueLocation: jest.fn().mockResolvedValue(undefined),
  getVenueLocation: jest.fn().mockResolvedValue({ latitude: -22.95, longitude: -43.18 }),
}));

describe('VenueService', () => {
  let service: VenueService;
  let prisma: {
    venue: { findUnique: jest.Mock; findFirst: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      venue: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
    };
    service = new VenueService(prisma as unknown as PrismaService);
  });

  it('assertOwner throws FORBIDDEN for another manager', async () => {
    prisma.venue.findUnique.mockResolvedValue({
      id: 'venue-1',
      managerId: 'manager-a',
    });

    await expect(service.assertOwner('venue-1', 'manager-b')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('assertOwner throws when venue is missing', async () => {
    prisma.venue.findUnique.mockResolvedValue(null);

    await expect(service.assertOwner('missing', 'manager-a')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
