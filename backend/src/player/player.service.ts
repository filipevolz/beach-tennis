import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SkillLevel } from '@prisma/client';
import { getPlayerLocation, setPlayerLocation } from '../common/utils/geo';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePlayerProfileDto } from './dto/update-player-profile.dto';

export interface PlayerProfileDto {
  userId: string;
  displayName: string;
  skillLevel: SkillLevel;
  bio: string | null;
  location: { latitude: number; longitude: number } | null;
  createdAt: Date;
  updatedAt: Date;
}

const ALLOWED_SKILL_LEVELS = new Set<string>(Object.values(SkillLevel));

@Injectable()
export class PlayerService {
  constructor(private readonly prisma: PrismaService) {}

  assertSkillLevel(skillLevel: string): void {
    if (!ALLOWED_SKILL_LEVELS.has(skillLevel)) {
      throw new BadRequestException({
        code: 'INVALID_SKILL_LEVEL',
        message: `skillLevel must be one of: ${[...ALLOWED_SKILL_LEVELS].join(', ')}`,
      });
    }
  }

  async getProfile(userId: string): Promise<PlayerProfileDto> {
    const profile = await this.prisma.playerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException({
        code: 'PLAYER_PROFILE_NOT_FOUND',
        message: 'Player profile not found',
      });
    }

    const location = await getPlayerLocation(this.prisma, userId);

    return {
      userId: profile.userId,
      displayName: profile.displayName,
      skillLevel: profile.skillLevel,
      bio: profile.bio,
      location,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdatePlayerProfileDto,
  ): Promise<PlayerProfileDto> {
    if (dto.skillLevel) {
      this.assertSkillLevel(dto.skillLevel);
    }

    if (
      (dto.latitude !== undefined && dto.longitude === undefined) ||
      (dto.longitude !== undefined && dto.latitude === undefined)
    ) {
      throw new BadRequestException({
        code: 'INVALID_LOCATION',
        message: 'Both latitude and longitude are required to update location',
      });
    }

    const existing = await this.prisma.playerProfile.findUnique({
      where: { userId },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'PLAYER_PROFILE_NOT_FOUND',
        message: 'Player profile not found',
      });
    }

    await this.prisma.playerProfile.update({
      where: { userId },
      data: {
        displayName: dto.displayName,
        skillLevel: dto.skillLevel,
        bio: dto.bio,
      },
    });

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      await setPlayerLocation(this.prisma, userId, dto.latitude, dto.longitude);
    }

    return this.getProfile(userId);
  }
}
