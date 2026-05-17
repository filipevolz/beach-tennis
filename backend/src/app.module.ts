import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { AuthModule } from './auth/auth.module';
import { AvailabilityModule } from './availability/availability.module';
import { BookingModule } from './booking/booking.module';
import { MatchModule } from './match/match.module';
import { PlayerModule } from './player/player.module';
import { PrismaModule } from './prisma/prisma.module';
import { VenueModule } from './venue/venue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['../.env', '.env'],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        customProps: (req) => ({
          requestId: req.id,
          userId: (req as { user?: { id: string } }).user?.id,
        }),
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url,
          }),
        },
        customSuccessMessage: (req, res) =>
          `${req.method} ${req.url} ${res.statusCode}`,
        customAttributeKeys: {
          responseTime: 'durationMs',
        },
      },
    }),
    PrismaModule,
    AuthModule,
    PlayerModule,
    VenueModule,
    AvailabilityModule,
    MatchModule,
    BookingModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
  ],
})
export class AppModule {}
