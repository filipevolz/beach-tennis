import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt');
jest.mock('../common/utils/geo', () => ({
  setPlayerLocation: jest.fn().mockResolvedValue(undefined),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      create: jest.Mock;
      findUnique: jest.Mock;
    };
    playerProfile: { create: jest.Mock };
    venueManagerProfile: { create: jest.Mock };
    $transaction: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let configService: ConfigService;

  const playerUser = {
    id: 'user-1',
    email: 'player@example.com',
    passwordHash: 'hash',
    role: UserRole.player,
    createdAt: new Date(),
  };

  beforeEach(() => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    prisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      playerProfile: { create: jest.fn() },
      venueManagerProfile: { create: jest.fn() },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    jwtService = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token'),
      verifyAsync: jest.fn(),
    };

    const configMap: Record<string, string> = {
      'jwt.secret': 'test-secret',
      'jwt.accessTtl': '15m',
      'jwt.refreshTtl': '7d',
    };
    configService = {
      get: jest.fn((key: string) => configMap[key]),
      getOrThrow: jest.fn((key: string) => configMap[key]),
    } as unknown as ConfigService;

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      configService,
    );
  });

  it('registers player and returns tokens', async () => {
    prisma.user.create.mockResolvedValue(playerUser);
    prisma.playerProfile.create.mockResolvedValue({});

    const result = await service.register({
      email: 'player@example.com',
      password: 'password123',
      role: UserRole.player,
      playerProfile: {
        displayName: 'Player One',
        skillLevel: 'beginner',
        latitude: -22.9,
        longitude: -43.2,
      },
    });

    expect(result.user.role).toBe(UserRole.player);
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(prisma.playerProfile.create).toHaveBeenCalled();
  });

  it('registers venue_manager and creates venue manager profile', async () => {
    const managerUser = { ...playerUser, role: UserRole.venue_manager };
    prisma.user.create.mockResolvedValue(managerUser);
    jwtService.signAsync
      .mockReset()
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    await service.register({
      email: 'manager@example.com',
      password: 'password123',
      role: UserRole.venue_manager,
      venueManagerProfile: { displayName: 'Manager' },
    });

    expect(prisma.venueManagerProfile.create).toHaveBeenCalled();
  });

  it('throws 409 when email already exists', async () => {
    prisma.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '6.0.0',
        meta: { target: ['email'] },
      }),
    );

    await expect(
      service.register({
        email: 'dup@example.com',
        password: 'password123',
        role: UserRole.player,
        playerProfile: {
          displayName: 'Dup',
          skillLevel: 'beginner',
          latitude: 1,
          longitude: 1,
        },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(playerUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jwtService.signAsync
      .mockReset()
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const tokens = await service.login({
      email: 'player@example.com',
      password: 'password123',
    });

    expect(tokens.accessToken).toBe('access-token');
    expect(tokens.refreshToken).toBe('refresh-token');
  });

  it('rejects login with invalid password', async () => {
    prisma.user.findUnique.mockResolvedValue(playerUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({ email: 'player@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refreshes access token with valid refresh token', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: playerUser.id,
      role: playerUser.role,
      email: playerUser.email,
      type: 'refresh',
    });
    prisma.user.findUnique.mockResolvedValue(playerUser);
    jwtService.signAsync.mockReset().mockResolvedValue('new-access-token');

    const result = await service.refresh('valid-refresh');

    expect(result.accessToken).toBe('new-access-token');
  });

  it('rejects invalid refresh token', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

    await expect(service.refresh('bad-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects login when user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects refresh when user no longer exists', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: playerUser.id,
      role: playerUser.role,
      email: playerUser.email,
      type: 'refresh',
    });
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.refresh('valid-refresh')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects access token presented to refresh endpoint', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: playerUser.id,
      role: playerUser.role,
      email: playerUser.email,
      type: 'access',
    });

    await expect(service.refresh('access-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
