import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { Prisma, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { setPlayerLocation } from '../common/utils/geo';
import { AuthTokenPayload } from '../common/types/jwt-payload';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens & { user: User }> {
    this.assertProfileFields(dto);

    const passwordHash = await bcrypt.hash(dto.password, 12);

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email: dto.email.toLowerCase(),
            passwordHash,
            role: dto.role,
          },
        });

        if (dto.role === UserRole.player && dto.playerProfile) {
          await tx.playerProfile.create({
            data: {
              userId: created.id,
              displayName: dto.playerProfile.displayName,
              skillLevel: dto.playerProfile.skillLevel,
              bio: dto.playerProfile.bio,
            },
          });

          await setPlayerLocation(
            tx,
            created.id,
            dto.playerProfile.latitude,
            dto.playerProfile.longitude,
          );
        }

        if (dto.role === UserRole.venue_manager && dto.venueManagerProfile) {
          await tx.venueManagerProfile.create({
            data: {
              userId: created.id,
              displayName: dto.venueManagerProfile.displayName,
            },
          });
        }

        return created;
      });

      const tokens = await this.issueTokens(user);
      return { ...tokens, user };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Email is already registered',
        });
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    let payload: AuthTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<AuthTokenPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('jwt.secret'),
      });
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid or expired',
      });
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid or expired',
      });
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid or expired',
      });
    }

    const accessToken = await this.signAccessToken(user);
    return { accessToken };
  }

  private assertProfileFields(dto: RegisterDto): void {
    if (dto.role === UserRole.player && !dto.playerProfile) {
      throw new ConflictException({
        code: 'PROFILE_REQUIRED',
        message: 'playerProfile is required for player registration',
      });
    }

    if (dto.role === UserRole.venue_manager && !dto.venueManagerProfile) {
      throw new ConflictException({
        code: 'PROFILE_REQUIRED',
        message: 'venueManagerProfile is required for venue_manager registration',
      });
    }
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user),
      this.signRefreshToken(user),
    ]);

    return { accessToken, refreshToken };
  }

  private signAccessToken(user: User): Promise<string> {
    const payload: AuthTokenPayload = {
      sub: user.id,
      role: user.role,
      email: user.email,
      type: 'access',
    };

    return this.jwtService.signAsync(payload, this.signOptions('jwt.accessTtl'));
  }

  private signRefreshToken(user: User): Promise<string> {
    const payload: AuthTokenPayload = {
      sub: user.id,
      role: user.role,
      email: user.email,
      type: 'refresh',
    };

    return this.jwtService.signAsync(payload, this.signOptions('jwt.refreshTtl'));
  }

  private signOptions(ttlKey: 'jwt.accessTtl' | 'jwt.refreshTtl'): JwtSignOptions {
    return {
      secret: this.configService.getOrThrow<string>('jwt.secret'),
      expiresIn: this.configService.getOrThrow<string>(ttlKey) as JwtSignOptions['expiresIn'],
    };
  }
}
