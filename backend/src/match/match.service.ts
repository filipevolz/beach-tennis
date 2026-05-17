import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Match,
  MatchFormat,
  MatchSpot,
  MatchSpotStatus,
  MatchStatus,
  MatchVisibility,
  Prisma,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { Paginated } from '../common/types/pagination';
import { getMatchLocation, radiusMeters, setMatchLocation } from '../common/utils/geo';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMatchInput,
  DiscoveryQuery,
  IMatchService,
  MatchDto,
  MatchSpotDto,
} from './match.service.interface';

const SPOTS_BY_FORMAT: Record<MatchFormat, number> = {
  singles: 2,
  doubles: 4,
};

@Injectable()
export class MatchService implements IMatchService {
  constructor(private readonly prisma: PrismaService) {}

  static generateInviteCode(): string {
    return randomBytes(16).toString('base64url');
  }

  async create(userId: string, input: CreateMatchInput): Promise<MatchDto> {
    const spotCount = SPOTS_BY_FORMAT[input.format];
    const inviteCode =
      input.visibility === MatchVisibility.invite
        ? MatchService.generateInviteCode()
        : null;

    const match = await this.prisma.$transaction(async (tx) => {
      const created = await tx.match.create({
        data: {
          creatorId: userId,
          format: input.format,
          visibility: input.visibility,
          inviteCode,
          skillLevel: input.skillLevel,
          notes: input.notes,
          status: MatchStatus.forming,
        },
      });

      await setMatchLocation(tx, created.id, input.latitude, input.longitude);

      await tx.matchSpot.createMany({
        data: Array.from({ length: spotCount }, (_, index) => ({
          matchId: created.id,
          position: index + 1,
          status: MatchSpotStatus.open,
        })),
      });

      return created;
    });

    return this.findById(match.id);
  }

  async findPublicNearby(query: DiscoveryQuery): Promise<Paginated<MatchDto>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const meters = radiusMeters(query.radiusKm);

    const conditions: Prisma.Sql[] = [
      Prisma.sql`m.visibility = 'public'::"MatchVisibility"`,
      Prisma.sql`m.status IN ('forming'::"MatchStatus", 'open'::"MatchStatus")`,
      Prisma.sql`m.location IS NOT NULL`,
      Prisma.sql`ST_DWithin(
        m.location,
        ST_SetSRID(ST_MakePoint(${query.longitude}, ${query.latitude}), 4326)::geography,
        ${meters}
      )`,
    ];

    if (query.format) {
      conditions.push(Prisma.sql`m.format = ${query.format}::"MatchFormat"`);
    }
    if (query.skillLevel) {
      conditions.push(Prisma.sql`m.skill_level = ${query.skillLevel}::"SkillLevel"`);
    }

    const whereClause = Prisma.join(conditions, ' AND ');

    const countRows = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM matches m
      WHERE ${whereClause}
    `;

    const ids = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT m.id
      FROM matches m
      WHERE ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const items = await Promise.all(ids.map((row) => this.findById(row.id)));

    return {
      items,
      total: Number(countRows[0]?.count ?? 0),
      page,
      pageSize,
    };
  }

  async findByInviteCode(code: string): Promise<MatchDto> {
    const match = await this.prisma.match.findFirst({
      where: { inviteCode: code, visibility: MatchVisibility.invite },
    });

    if (!match) {
      throw new NotFoundException({
        code: 'MATCH_NOT_FOUND',
        message: 'Invite match not found',
      });
    }

    return this.findById(match.id);
  }

  async findById(matchId: string): Promise<MatchDto> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        spots: { orderBy: { position: 'asc' } },
      },
    });

    if (!match) {
      throw new NotFoundException({
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
      });
    }

    return this.toDto(match);
  }

  async joinSpot(matchId: string, userId: string): Promise<MatchSpotDto> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { spots: { orderBy: { position: 'asc' } } },
    });

    if (!match) {
      throw new NotFoundException({
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
      });
    }

    if (match.status === MatchStatus.booked || match.status === MatchStatus.cancelled) {
      throw new ConflictException({
        code: 'MATCH_CLOSED',
        message: 'Match is no longer accepting players',
      });
    }

    const existingSpot = match.spots.find((spot) => spot.playerId === userId);
    if (existingSpot) {
      return this.toSpotDto(existingSpot);
    }

    const openSpot = match.spots.find((spot) => spot.status === MatchSpotStatus.open);
    if (!openSpot) {
      throw new ConflictException({
        code: 'MATCH_FULL',
        message: 'Match has no open spots',
      });
    }

    const updatedSpot = await this.prisma.$transaction(async (tx) => {
      const spot = await tx.matchSpot.update({
        where: { id: openSpot.id },
        data: {
          playerId: userId,
          status: MatchSpotStatus.filled,
        },
      });

      const spots = await tx.matchSpot.findMany({
        where: { matchId },
        orderBy: { position: 'asc' },
      });

      const nextStatus = this.resolveStatusAfterSpotsChange(match.status, spots);
      if (nextStatus !== match.status) {
        await tx.match.update({
          where: { id: matchId },
          data: { status: nextStatus },
        });
      }

      return spot;
    });

    return this.toSpotDto(updatedSpot);
  }

  async leaveSpot(matchId: string, userId: string): Promise<void> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { spots: { orderBy: { position: 'asc' } } },
    });

    if (!match) {
      throw new NotFoundException({
        code: 'MATCH_NOT_FOUND',
        message: 'Match not found',
      });
    }

    const userSpot = match.spots.find((spot) => spot.playerId === userId);
    if (!userSpot) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.matchSpot.update({
        where: { id: userSpot.id },
        data: {
          playerId: null,
          status: MatchSpotStatus.open,
        },
      });

      const spots = await tx.matchSpot.findMany({
        where: { matchId },
        orderBy: { position: 'asc' },
      });

      const nextStatus = this.resolveStatusAfterLeave(match.status, spots);
      await tx.match.update({
        where: { id: matchId },
        data: { status: nextStatus },
      });
    });
  }

  private resolveStatusAfterSpotsChange(
    current: MatchStatus,
    spots: MatchSpot[],
  ): MatchStatus {
    const filledCount = spots.filter((s) => s.status === MatchSpotStatus.filled).length;
    if (filledCount === spots.length) {
      return MatchStatus.ready_to_book;
    }
    if (filledCount > 0) {
      return MatchStatus.open;
    }
    return MatchStatus.forming;
  }

  private resolveStatusAfterLeave(current: MatchStatus, spots: MatchSpot[]): MatchStatus {
    if (current === MatchStatus.booked) {
      return current;
    }
    return this.resolveStatusAfterSpotsChange(MatchStatus.forming, spots);
  }

  private async toDto(
    match: Match & { spots: MatchSpot[] },
  ): Promise<MatchDto> {
    const location = await getMatchLocation(this.prisma, match.id);
    return {
      id: match.id,
      creatorId: match.creatorId,
      format: match.format,
      visibility: match.visibility,
      inviteCode: match.inviteCode,
      skillLevel: match.skillLevel,
      status: match.status,
      notes: match.notes,
      location,
      spots: match.spots.map((spot) => this.toSpotDto(spot)),
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
    };
  }

  private toSpotDto(spot: MatchSpot): MatchSpotDto {
    return {
      id: spot.id,
      position: spot.position,
      status: spot.status,
      playerId: spot.playerId,
    };
  }
}
