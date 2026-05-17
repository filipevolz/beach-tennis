import {
  Match,
  MatchFormat,
  MatchSpotStatus,
  MatchVisibility,
  SkillLevel,
} from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';
import { MatchService } from '../../src/match/match.service';
import { setMatchLocation } from '../../src/common/utils/geo';

const SPOTS_BY_FORMAT: Record<MatchFormat, number> = {
  singles: 2,
  doubles: 4,
};

export interface CreateMatchOptions {
  creatorId: string;
  format?: MatchFormat;
  visibility?: MatchVisibility;
  skillLevel?: SkillLevel;
  latitude?: number;
  longitude?: number;
}

export async function createMatch(
  prisma: PrismaService,
  options: CreateMatchOptions,
): Promise<Match> {
  const format = options.format ?? MatchFormat.singles;
  const visibility = options.visibility ?? MatchVisibility.public;
  const inviteCode =
    visibility === MatchVisibility.invite ? MatchService.generateInviteCode() : null;

  const match = await prisma.$transaction(async (tx) => {
    const created = await tx.match.create({
      data: {
        creatorId: options.creatorId,
        format,
        visibility,
        inviteCode,
        skillLevel: options.skillLevel ?? SkillLevel.intermediate,
        status: 'forming',
      },
    });

    await setMatchLocation(
      tx,
      created.id,
      options.latitude ?? -22.95,
      options.longitude ?? -43.18,
    );

    await tx.matchSpot.createMany({
      data: Array.from({ length: SPOTS_BY_FORMAT[format] }, (_, index) => ({
        matchId: created.id,
        position: index + 1,
        status: MatchSpotStatus.open,
      })),
    });

    return created;
  });

  return match;
}
