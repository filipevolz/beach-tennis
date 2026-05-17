import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SkillLevel } from '@prisma/client';
import { PlayerService } from './player.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('../common/utils/geo', () => ({
  getPlayerLocation: jest.fn().mockResolvedValue({ latitude: -22.9, longitude: -43.2 }),
  setPlayerLocation: jest.fn().mockResolvedValue(undefined),
}));

describe('PlayerService', () => {
  let service: PlayerService;
  let prisma: {
    playerProfile: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  const profile = {
    userId: 'user-1',
    displayName: 'Player',
    skillLevel: SkillLevel.beginner,
    bio: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      playerProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new PlayerService(prisma as unknown as PrismaService);
  });

  it('returns player profile', async () => {
    prisma.playerProfile.findUnique.mockResolvedValue(profile);

    const result = await service.getProfile('user-1');

    expect(result.displayName).toBe('Player');
    expect(result.location).toEqual({ latitude: -22.9, longitude: -43.2 });
  });

  it('rejects invalid skill level', () => {
    expect(() => service.assertSkillLevel('expert')).toThrow(BadRequestException);
  });

  it('updates profile fields', async () => {
    prisma.playerProfile.findUnique
      .mockResolvedValueOnce(profile)
      .mockResolvedValueOnce({
        ...profile,
        displayName: 'Updated',
        skillLevel: SkillLevel.advanced,
      });
    prisma.playerProfile.update.mockResolvedValue({
      ...profile,
      displayName: 'Updated',
      skillLevel: SkillLevel.advanced,
    });

    const result = await service.updateProfile('user-1', {
      displayName: 'Updated',
      skillLevel: SkillLevel.advanced,
    });

    expect(result.displayName).toBe('Updated');
    expect(prisma.playerProfile.update).toHaveBeenCalled();
  });

  it('throws when profile is missing', async () => {
    prisma.playerProfile.findUnique.mockResolvedValue(null);

    await expect(service.getProfile('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects partial location updates', async () => {
    prisma.playerProfile.findUnique.mockResolvedValue(profile);

    await expect(
      service.updateProfile('user-1', { latitude: -22.9 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
