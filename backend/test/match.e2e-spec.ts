import { INestApplication } from '@nestjs/common';
import {
  MatchFormat,
  MatchVisibility,
  UserRole,
} from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { registerAndLogin } from './auth.helper';
import { createE2eApp } from './e2e-app';

describe('Match marketplace (e2e)', () => {
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

  it('scenario 1: publish slot → public match → join → booking confirm → slot reserved', async () => {
    const manager = await registerAndLogin(app, UserRole.venue_manager, `m1-${unique}`);
    const creator = await registerAndLogin(app, UserRole.player, `c1-${unique}`);
    const joiner = await registerAndLogin(app, UserRole.player, `j1-${unique}`);

    const venueResponse = await request(app.getHttpServer())
      .post('/api/v1/venues')
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .send({
        name: 'Arena E2E',
        address: 'Rua Teste',
        latitude: -22.95,
        longitude: -43.18,
      })
      .expect(201);

    const courtResponse = await request(app.getHttpServer())
      .post(`/api/v1/venues/${venueResponse.body.id}/courts`)
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .send({ name: 'Quadra 1' })
      .expect(201);

    const startsAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const endsAt = new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString();

    const slotResponse = await request(app.getHttpServer())
      .post(`/api/v1/venues/${venueResponse.body.id}/availability-slots`)
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .send({
        courtId: courtResponse.body.id,
        startsAt,
        endsAt,
      })
      .expect(201);

    const matchResponse = await request(app.getHttpServer())
      .post('/api/v1/matches')
      .set('Authorization', `Bearer ${creator.accessToken}`)
      .send({
        format: MatchFormat.singles,
        visibility: MatchVisibility.public,
        skillLevel: 'intermediate',
        latitude: -22.95,
        longitude: -43.18,
      })
      .expect(201);

    expect(matchResponse.body.spots).toHaveLength(2);

    await request(app.getHttpServer())
      .post(`/api/v1/matches/${matchResponse.body.id}/spots/join`)
      .set('Authorization', `Bearer ${creator.accessToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/matches/${matchResponse.body.id}/spots/join`)
      .set('Authorization', `Bearer ${joiner.accessToken}`)
      .expect(201);

    const bookingResponse = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${creator.accessToken}`)
      .send({
        matchId: matchResponse.body.id,
        availabilitySlotId: slotResponse.body.id,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingResponse.body.id}/confirm`)
      .set('Authorization', `Bearer ${creator.accessToken}`)
      .expect(200);

    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: slotResponse.body.id },
    });
    expect(slot?.status).toBe('reserved');

    const match = await prisma.match.findUnique({
      where: { id: matchResponse.body.id },
    });
    expect(match?.status).toBe('booked');
  });

  it('scenario 2: invite match hidden from public discovery but accessible via invite code', async () => {
    const creator = await registerAndLogin(app, UserRole.player, `inv-${unique}`);

    const matchResponse = await request(app.getHttpServer())
      .post('/api/v1/matches')
      .set('Authorization', `Bearer ${creator.accessToken}`)
      .send({
        format: MatchFormat.singles,
        visibility: MatchVisibility.invite,
        skillLevel: 'intermediate',
        latitude: -22.95,
        longitude: -43.18,
      })
      .expect(201);

    const inviteCode = matchResponse.body.inviteCode as string;
    expect(inviteCode).toBeTruthy();

    const discoveryResponse = await request(app.getHttpServer())
      .get('/api/v1/matches')
      .query({ lat: -22.95, lng: -43.18, radiusKm: 50 })
      .set('Authorization', `Bearer ${creator.accessToken}`)
      .expect(200);

    const ids = discoveryResponse.body.items.map((item: { id: string }) => item.id);
    expect(ids).not.toContain(matchResponse.body.id);

    const inviteResponse = await request(app.getHttpServer())
      .get(`/api/v1/matches/invite/${inviteCode}`)
      .expect(200);

    expect(inviteResponse.body.id).toBe(matchResponse.body.id);
  });

  it('venue_manager receives 403 on POST /matches', async () => {
    const manager = await registerAndLogin(app, UserRole.venue_manager, `mgr-match-${unique}`);

    await request(app.getHttpServer())
      .post('/api/v1/matches')
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .send({
        format: MatchFormat.singles,
        visibility: MatchVisibility.public,
        skillLevel: 'intermediate',
        latitude: -22.95,
        longitude: -43.18,
      })
      .expect(403);
  });
});
