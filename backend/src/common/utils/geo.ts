import { Prisma, PrismaClient } from '@prisma/client';

type GeoClient = PrismaClient | Prisma.TransactionClient;

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export async function setPlayerLocation(
  prisma: GeoClient,
  userId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE player_profiles
    SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
    WHERE user_id = ${userId}::uuid
  `;
}

export async function getPlayerLocation(
  prisma: GeoClient,
  userId: string,
): Promise<GeoPoint | null> {
  return getPointFromTable(prisma, 'player_profiles', 'user_id', userId);
}

export async function setVenueLocation(
  prisma: GeoClient,
  venueId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE venues
    SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
    WHERE id = ${venueId}::uuid
  `;
}

export async function getVenueLocation(
  prisma: GeoClient,
  venueId: string,
): Promise<GeoPoint | null> {
  return getPointFromTable(prisma, 'venues', 'id', venueId);
}

export async function setMatchLocation(
  prisma: GeoClient,
  matchId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE matches
    SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
    WHERE id = ${matchId}::uuid
  `;
}

export async function getMatchLocation(
  prisma: GeoClient,
  matchId: string,
): Promise<GeoPoint | null> {
  return getPointFromTable(prisma, 'matches', 'id', matchId);
}

async function getPointFromTable(
  prisma: GeoClient,
  table: 'player_profiles' | 'venues' | 'matches',
  idColumn: string,
  id: string,
): Promise<GeoPoint | null> {
  const rows = await prisma.$queryRawUnsafe<Array<{ latitude: number; longitude: number }>>(
    `
    SELECT
      ST_Y(location::geometry) AS latitude,
      ST_X(location::geometry) AS longitude
    FROM ${table}
    WHERE ${idColumn} = $1::uuid
      AND location IS NOT NULL
    `,
    id,
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
  };
}

export function radiusMeters(radiusKm: number): number {
  return radiusKm * 1000;
}
