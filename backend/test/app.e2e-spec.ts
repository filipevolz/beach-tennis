import { INestApplication } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createE2eApp } from './e2e-app';

describe('Auth and Player (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const unique = Date.now();

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('register player → login → GET /players/me', async () => {
    const email = `player-${unique}@example.com`;

    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'password123',
        role: UserRole.player,
        playerProfile: {
          displayName: 'E2E Player',
          skillLevel: 'intermediate',
          latitude: -22.95,
          longitude: -43.18,
        },
      })
      .expect(201);

    expect(registerResponse.body.accessToken).toBeDefined();
    expect(registerResponse.body.user.role).toBe(UserRole.player);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);

    const accessToken = loginResponse.body.accessToken as string;

    const profileResponse = await request(app.getHttpServer())
      .get('/api/v1/players/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(profileResponse.body.displayName).toBe('E2E Player');
    expect(profileResponse.body.skillLevel).toBe('intermediate');
    expect(profileResponse.body.location).toEqual({
      latitude: expect.any(Number),
      longitude: expect.any(Number),
    });
  });

  it('PATCH /players/me updates profile', async () => {
    const email = `patch-${unique}@example.com`;

    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'password123',
        role: UserRole.player,
        playerProfile: {
          displayName: 'Before Patch',
          skillLevel: 'beginner',
          latitude: -22.9,
          longitude: -43.2,
        },
      })
      .expect(201);

    const token = registerResponse.body.accessToken as string;

    const patchResponse = await request(app.getHttpServer())
      .patch('/api/v1/players/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        displayName: 'After Patch',
        skillLevel: 'advanced',
      })
      .expect(200);

    expect(patchResponse.body.displayName).toBe('After Patch');
    expect(patchResponse.body.skillLevel).toBe('advanced');

    const stored = await prisma.playerProfile.findUnique({
      where: { userId: registerResponse.body.user.id },
    });

    expect(stored?.displayName).toBe('After Patch');
    expect(stored?.skillLevel).toBe('advanced');
  });

  it('GET /players/me without Authorization returns 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/players/me').expect(401);
  });

  it('venue_manager receives 403 on GET /players/me', async () => {
    const email = `manager-${unique}@example.com`;

    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'password123',
        role: UserRole.venue_manager,
        venueManagerProfile: { displayName: 'Venue Manager' },
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/v1/players/me')
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .expect(403);
  });
});
