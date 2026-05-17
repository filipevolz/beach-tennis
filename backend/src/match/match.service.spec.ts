import { NotFoundException } from '@nestjs/common';
import {
  MatchFormat,
  MatchSpotStatus,
  MatchStatus,
  MatchVisibility,
  SkillLevel,
} from '@prisma/client';
import { MatchService } from './match.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('../common/utils/geo', () => ({
  setMatchLocation: jest.fn().mockResolvedValue(undefined),
  getMatchLocation: jest.fn().mockResolvedValue({ latitude: -22.95, longitude: -43.18 }),
  radiusMeters: (km: number) => km * 1000,
}));

describe('MatchService', () => {
  let service: MatchService;
  let prisma: {
    $transaction: jest.Mock;
    match: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    matchSpot: {
      createMany: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
    };
    $queryRaw: jest.Mock;
  };

  const baseMatch = {
    id: 'match-1',
    creatorId: 'creator-1',
    format: MatchFormat.singles,
    visibility: MatchVisibility.public,
    inviteCode: null,
    skillLevel: SkillLevel.intermediate,
    status: MatchStatus.forming,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    spots: [
      { id: 's1', matchId: 'match-1', playerId: null, status: MatchSpotStatus.open, position: 1 },
      { id: 's2', matchId: 'match-1', playerId: null, status: MatchSpotStatus.open, position: 2 },
    ],
  };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn((callback) => callback(prisma)),
      match: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      matchSpot: {
        createMany: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      $queryRaw: jest.fn(),
    };

    service = new MatchService(prisma as unknown as PrismaService);
  });

  it('create with singles creates exactly 2 open spots', async () => {
    prisma.match.create.mockResolvedValue({ ...baseMatch, id: 'new-match' });
    prisma.match.findUnique.mockResolvedValue({
      ...baseMatch,
      id: 'new-match',
    });

    const result = await service.create('creator-1', {
      format: MatchFormat.singles,
      visibility: MatchVisibility.public,
      skillLevel: SkillLevel.intermediate,
      latitude: -22.95,
      longitude: -43.18,
    });

    expect(prisma.matchSpot.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ position: 1, status: MatchSpotStatus.open }),
        expect.objectContaining({ position: 2, status: MatchSpotStatus.open }),
      ]),
    });
    expect(result.spots).toHaveLength(2);
    expect(result.spots.every((spot) => spot.status === MatchSpotStatus.open)).toBe(true);
  });

  it('create with doubles creates exactly 4 spots', async () => {
    prisma.match.create.mockResolvedValue({ ...baseMatch, format: MatchFormat.doubles });
    prisma.match.findUnique.mockResolvedValue({
      ...baseMatch,
      format: MatchFormat.doubles,
      spots: Array.from({ length: 4 }, (_, index) => ({
        id: `s${index}`,
        matchId: 'match-1',
        playerId: null,
        status: MatchSpotStatus.open,
        position: index + 1,
      })),
    });

    await service.create('creator-1', {
      format: MatchFormat.doubles,
      visibility: MatchVisibility.public,
      skillLevel: SkillLevel.intermediate,
      latitude: -22.95,
      longitude: -43.18,
    });

    expect(prisma.matchSpot.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ position: 1 }),
        expect.objectContaining({ position: 2 }),
        expect.objectContaining({ position: 3 }),
        expect.objectContaining({ position: 4 }),
      ],
    });
  });

  it('joinSpot on full singles match returns MATCH_FULL', async () => {
    prisma.match.findUnique.mockResolvedValue({
      ...baseMatch,
      spots: [
        { ...baseMatch.spots[0], playerId: 'p1', status: MatchSpotStatus.filled },
        { ...baseMatch.spots[1], playerId: 'p2', status: MatchSpotStatus.filled },
      ],
    });

    await expect(service.joinSpot('match-1', 'p3')).rejects.toMatchObject({
      response: { code: 'MATCH_FULL' },
    });
  });

  it('findPublicNearby uses geo query and returns paginated public matches', async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([{ count: BigInt(1) }])
      .mockResolvedValueOnce([{ id: 'match-1' }]);
    prisma.match.findUnique.mockResolvedValue({
      ...baseMatch,
      visibility: MatchVisibility.public,
    });

    const result = await service.findPublicNearby({
      latitude: -22.95,
      longitude: -43.18,
      radiusKm: 10,
      format: MatchFormat.singles,
      skillLevel: SkillLevel.intermediate,
    });

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].visibility).toBe(MatchVisibility.public);
  });

  it('joinSpot fills the first open spot and advances match status', async () => {
    prisma.match.findUnique
      .mockResolvedValueOnce({
        ...baseMatch,
        spots: baseMatch.spots,
      })
      .mockResolvedValueOnce({
        ...baseMatch,
        status: MatchStatus.open,
        spots: [
          { ...baseMatch.spots[0], playerId: 'p1', status: MatchSpotStatus.filled },
          baseMatch.spots[1],
        ],
      });
    prisma.matchSpot.update.mockResolvedValue({
      ...baseMatch.spots[0],
      playerId: 'p1',
      status: MatchSpotStatus.filled,
    });
    prisma.matchSpot.findMany.mockResolvedValue([
      { ...baseMatch.spots[0], playerId: 'p1', status: MatchSpotStatus.filled },
      baseMatch.spots[1],
    ]);
    prisma.match.update.mockResolvedValue({ ...baseMatch, status: MatchStatus.open });

    const spot = await service.joinSpot('match-1', 'p1');

    expect(spot.playerId).toBe('p1');
    expect(prisma.match.update).toHaveBeenCalled();
  });

  it('leaveSpot clears the player spot', async () => {
    prisma.match.findUnique.mockResolvedValue({
      ...baseMatch,
      status: MatchStatus.open,
      spots: [
        { ...baseMatch.spots[0], playerId: 'p1', status: MatchSpotStatus.filled },
        baseMatch.spots[1],
      ],
    });
    prisma.matchSpot.findMany.mockResolvedValue([
      { ...baseMatch.spots[0], playerId: null, status: MatchSpotStatus.open },
      baseMatch.spots[1],
    ]);

    await service.leaveSpot('match-1', 'p1');

    expect(prisma.matchSpot.update).toHaveBeenCalledWith({
      where: { id: baseMatch.spots[0].id },
      data: { playerId: null, status: MatchSpotStatus.open },
    });
  });

  it('findById throws when match is missing', async () => {
    prisma.match.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('joinSpot returns existing spot when player already joined', async () => {
    const filledSpot = {
      ...baseMatch.spots[0],
      playerId: 'p1',
      status: MatchSpotStatus.filled,
    };
    prisma.match.findUnique.mockResolvedValue({
      ...baseMatch,
      spots: [filledSpot, baseMatch.spots[1]],
    });

    const spot = await service.joinSpot('match-1', 'p1');
    expect(spot.playerId).toBe('p1');
    expect(prisma.matchSpot.update).not.toHaveBeenCalled();
  });

  it('joinSpot rejects closed matches', async () => {
    prisma.match.findUnique.mockResolvedValue({
      ...baseMatch,
      status: MatchStatus.booked,
      spots: baseMatch.spots,
    });

    await expect(service.joinSpot('match-1', 'p1')).rejects.toMatchObject({
      response: { code: 'MATCH_CLOSED' },
    });
  });

  it('joinSpot moves match to ready_to_book when all spots are filled', async () => {
    prisma.match.findUnique.mockResolvedValueOnce({
      ...baseMatch,
      spots: [baseMatch.spots[0], baseMatch.spots[1]],
    });
    prisma.matchSpot.update.mockResolvedValue({
      ...baseMatch.spots[1],
      playerId: 'p2',
      status: MatchSpotStatus.filled,
    });
    prisma.matchSpot.findMany.mockResolvedValue([
      { ...baseMatch.spots[0], playerId: 'p1', status: MatchSpotStatus.filled },
      { ...baseMatch.spots[1], playerId: 'p2', status: MatchSpotStatus.filled },
    ]);
    prisma.match.update.mockResolvedValue({
      ...baseMatch,
      status: MatchStatus.ready_to_book,
    });

    await service.joinSpot('match-1', 'p2');

    expect(prisma.match.update).toHaveBeenCalledWith({
      where: { id: 'match-1' },
      data: { status: MatchStatus.ready_to_book },
    });
  });

  it('leaveSpot is a no-op when the player has no spot', async () => {
    prisma.match.findUnique.mockResolvedValue(baseMatch);

    await service.leaveSpot('match-1', 'unknown');

    expect(prisma.matchSpot.update).not.toHaveBeenCalled();
  });

  it('create generates invite code for invite visibility', async () => {
    prisma.match.create.mockResolvedValue({
      ...baseMatch,
      visibility: MatchVisibility.invite,
      inviteCode: 'invite-token',
    });
    prisma.match.findUnique.mockResolvedValue({
      ...baseMatch,
      visibility: MatchVisibility.invite,
      inviteCode: 'invite-token',
    });

    await service.create('creator-1', {
      format: MatchFormat.singles,
      visibility: MatchVisibility.invite,
      skillLevel: SkillLevel.intermediate,
      latitude: -22.95,
      longitude: -43.18,
    });

    expect(prisma.match.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          inviteCode: expect.any(String),
          visibility: MatchVisibility.invite,
        }),
      }),
    );
  });

  it('findByInviteCode returns match for valid code', async () => {
    prisma.match.findFirst.mockResolvedValue({ ...baseMatch, inviteCode: 'abc' });
    prisma.match.findUnique.mockResolvedValue({ ...baseMatch, inviteCode: 'abc' });

    const result = await service.findByInviteCode('abc');
    expect(result.inviteCode).toBe('abc');
  });

  it('findByInviteCode throws 404 for invalid code', async () => {
    prisma.match.findFirst.mockResolvedValue(null);

    await expect(service.findByInviteCode('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('generates unique invite codes across 1000 iterations', () => {
    const codes = new Set<string>();
    for (let index = 0; index < 1000; index += 1) {
      codes.add(MatchService.generateInviteCode());
    }
    expect(codes.size).toBe(1000);
  });
});
