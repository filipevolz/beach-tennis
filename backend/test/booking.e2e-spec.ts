import { INestApplication } from '@nestjs/common';
import { MatchFormat, MatchVisibility, UserRole } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { registerAndLogin } from './auth.helper';
import { createE2eApp } from './e2e-app';

describe('Booking marketplace (e2e)', () => {
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

  async function seedSlotAndMatch(suffix: string) {
    const manager = await registerAndLogin(app, UserRole.venue_manager, `bm-${suffix}`);
    const creator = await registerAndLogin(app, UserRole.player, `bp-${suffix}`);
    const joiner = await registerAndLogin(app, UserRole.player, `bj-${suffix}`);

    const venue = await request(app.getHttpServer())
      .post('/api/v1/venues')
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .send({
        name: 'Booking Arena',
        address: 'Rua Booking',
        latitude: -22.95,
        longitude: -43.18,
      })
      .expect(201);

    const court = await request(app.getHttpServer())
      .post(`/api/v1/venues/${venue.body.id}/courts`)
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .send({ name: 'Quadra Booking' })
      .expect(201);

    const slot = await request(app.getHttpServer())
      .post(`/api/v1/venues/${venue.body.id}/availability-slots`)
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .send({
        courtId: court.body.id,
        startsAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 73 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    const match = await request(app.getHttpServer())
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

    await request(app.getHttpServer())
      .post(`/api/v1/matches/${match.body.id}/spots/join`)
      .set('Authorization', `Bearer ${creator.accessToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/matches/${match.body.id}/spots/join`)
      .set('Authorization', `Bearer ${joiner.accessToken}`)
      .expect(201);

    const booking = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${creator.accessToken}`)
      .send({
        matchId: match.body.id,
        availabilitySlotId: slot.body.id,
      })
      .expect(201);

    return { creator, bookingId: booking.body.id as string };
  }

  it('scenario 3: concurrent confirm → one success and one 409', async () => {
    const { creator, bookingId } = await seedSlotAndMatch(`cc-${unique}`);

    const confirm = () =>
      request(app.getHttpServer())
        .post(`/api/v1/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${creator.accessToken}`);

    const [first, second] = await Promise.all([confirm(), confirm()]);
    const statuses = [first.status, second.status].sort();

    expect(statuses).toEqual([200, 409]);
  });

  it('manager B receives 403 patching manager A slot', async () => {
    const managerA = await registerAndLogin(app, UserRole.venue_manager, `ma-${unique}`);
    const managerB = await registerAndLogin(app, UserRole.venue_manager, `mb-${unique}`);

    const venue = await request(app.getHttpServer())
      .post('/api/v1/venues')
      .set('Authorization', `Bearer ${managerA.accessToken}`)
      .send({
        name: 'Arena A',
        address: 'Rua A',
        latitude: -22.95,
        longitude: -43.18,
      })
      .expect(201);

    const court = await request(app.getHttpServer())
      .post(`/api/v1/venues/${venue.body.id}/courts`)
      .set('Authorization', `Bearer ${managerA.accessToken}`)
      .send({ name: 'Quadra A' })
      .expect(201);

    const slot = await request(app.getHttpServer())
      .post(`/api/v1/venues/${venue.body.id}/availability-slots`)
      .set('Authorization', `Bearer ${managerA.accessToken}`)
      .send({
        courtId: court.body.id,
        startsAt: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 97 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/availability-slots/${slot.body.id}`)
      .set('Authorization', `Bearer ${managerB.accessToken}`)
      .send({ status: 'cancelled' })
      .expect(403);
  });
});
