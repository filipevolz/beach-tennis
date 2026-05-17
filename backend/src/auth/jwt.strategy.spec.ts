import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: { user: { findUnique: jest.Mock } };

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn() } };

    strategy = new JwtStrategy(
      {
        getOrThrow: jest.fn().mockReturnValue('test-secret'),
      } as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );
  });

  it('rejects refresh tokens used as access tokens', async () => {
    await expect(
      strategy.validate({
        sub: 'user-1',
        role: UserRole.player,
        email: 'p@example.com',
        type: 'refresh',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns authenticated user for access token payload', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'p@example.com',
      role: UserRole.player,
    });

    const user = await strategy.validate({
      sub: 'user-1',
      role: UserRole.player,
      email: 'p@example.com',
      type: 'access',
    });

    expect(user.id).toBe('user-1');
  });

  it('rejects when user no longer exists', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: 'user-1',
        role: UserRole.player,
        email: 'p@example.com',
        type: 'access',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
