import { INestApplication } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import request from 'supertest';

export async function registerAndLogin(
  app: INestApplication,
  role: UserRole,
  suffix: string,
): Promise<{ accessToken: string; userId: string }> {
  const email = `${role}-${suffix}-${Date.now()}@test.com`;

  const body =
    role === UserRole.player
      ? {
          email,
          password: 'password123',
          role,
          playerProfile: {
            displayName: `Player ${suffix}`,
            skillLevel: 'intermediate',
            latitude: -22.95,
            longitude: -43.18,
          },
        }
      : {
          email,
          password: 'password123',
          role,
          venueManagerProfile: { displayName: `Manager ${suffix}` },
        };

  const registerResponse = await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send(body)
    .expect(201);

  return {
    accessToken: registerResponse.body.accessToken as string,
    userId: registerResponse.body.user.id as string,
  };
}
