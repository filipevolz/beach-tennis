import { SkillLevel, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../src/prisma/prisma.service';
import { setPlayerLocation } from '../../src/common/utils/geo';

export interface CreatePlayerOptions {
  email?: string;
  displayName?: string;
  skillLevel?: SkillLevel;
  latitude?: number;
  longitude?: number;
}

export async function createPlayer(
  prisma: PrismaService,
  options: CreatePlayerOptions = {},
): Promise<{ user: User; token?: string }> {
  const email = options.email ?? `player-${Date.now()}-${Math.random()}@test.com`;
  const passwordHash = await bcrypt.hash('password123', 4);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.player,
      },
    });

    await tx.playerProfile.create({
      data: {
        userId: created.id,
        displayName: options.displayName ?? 'Test Player',
        skillLevel: options.skillLevel ?? SkillLevel.intermediate,
      },
    });

    await setPlayerLocation(
      tx,
      created.id,
      options.latitude ?? -22.95,
      options.longitude ?? -43.18,
    );

    return created;
  });

  return { user };
}

export interface CreateVenueManagerOptions {
  email?: string;
  displayName?: string;
}

export async function createVenueManager(
  prisma: PrismaService,
  options: CreateVenueManagerOptions = {},
): Promise<User> {
  const email =
    options.email ?? `manager-${Date.now()}-${Math.random()}@test.com`;
  const passwordHash = await bcrypt.hash('password123', 4);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.venue_manager,
      },
    });

    await tx.venueManagerProfile.create({
      data: {
        userId: user.id,
        displayName: options.displayName ?? 'Test Manager',
      },
    });

    return user;
  });
}
