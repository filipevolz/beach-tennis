import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AvailabilitySlot, AvailabilitySlotStatus, Prisma } from '@prisma/client';
import { Paginated } from '../common/types/pagination';
import { radiusMeters } from '../common/utils/geo';
import { PrismaService } from '../prisma/prisma.service';
import { VenueService } from '../venue/venue.service';
import { ListSlotsQueryDto } from './dto/list-slots-query.dto';
import { PublishSlotDto } from './dto/publish-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';

export interface AvailabilitySlotDto {
  id: string;
  courtId: string;
  venueId: string;
  venueName: string;
  startsAt: Date;
  endsAt: Date;
  status: AvailabilitySlotStatus;
  priceCents: number | null;
}

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly venueService: VenueService,
  ) {}

  async publish(
    venueId: string,
    managerId: string,
    dto: PublishSlotDto,
  ): Promise<AvailabilitySlotDto> {
    await this.venueService.assertOwner(venueId, managerId);

    const court = await this.prisma.court.findFirst({
      where: { id: dto.courtId, venueId },
    });

    if (!court) {
      throw new NotFoundException({
        code: 'COURT_NOT_FOUND',
        message: 'Court not found for this venue',
      });
    }

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException({
        code: 'INVALID_SLOT_RANGE',
        message: 'endsAt must be after startsAt',
      });
    }

    const slot = await this.prisma.availabilitySlot.create({
      data: {
        courtId: dto.courtId,
        startsAt,
        endsAt,
        priceCents: dto.priceCents,
        status: AvailabilitySlotStatus.available,
      },
      include: {
        court: { include: { venue: true } },
      },
    });

    return this.toDto(slot);
  }

  async findNearby(query: ListSlotsQueryDto): Promise<Paginated<AvailabilitySlotDto>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const meters = radiusMeters(query.radiusKm);

    const statusFilter = query.status ?? AvailabilitySlotStatus.available;
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;

    const conditions: Prisma.Sql[] = [
      Prisma.sql`s.status = ${statusFilter}::"AvailabilitySlotStatus"`,
      Prisma.sql`v.location IS NOT NULL`,
      Prisma.sql`ST_DWithin(
        v.location,
        ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography,
        ${meters}
      )`,
    ];

    if (from) {
      conditions.push(Prisma.sql`s.starts_at >= ${from}`);
    }
    if (to) {
      conditions.push(Prisma.sql`s.starts_at <= ${to}`);
    }

    const whereClause = Prisma.join(conditions, ' AND ');

    const countRows = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM availability_slots s
      INNER JOIN courts c ON c.id = s.court_id
      INNER JOIN venues v ON v.id = c.venue_id
      WHERE ${whereClause}
    `;

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        court_id: string;
        venue_id: string;
        venue_name: string;
        starts_at: Date;
        ends_at: Date;
        status: AvailabilitySlotStatus;
        price_cents: number | null;
      }>
    >`
      SELECT
        s.id,
        s.court_id,
        v.id AS venue_id,
        v.name AS venue_name,
        s.starts_at,
        s.ends_at,
        s.status,
        s.price_cents
      FROM availability_slots s
      INNER JOIN courts c ON c.id = s.court_id
      INNER JOIN venues v ON v.id = c.venue_id
      WHERE ${whereClause}
      ORDER BY s.starts_at ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    return {
      items: rows.map((row) => ({
        id: row.id,
        courtId: row.court_id,
        venueId: row.venue_id,
        venueName: row.venue_name,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        status: row.status,
        priceCents: row.price_cents,
      })),
      total: Number(countRows[0]?.count ?? 0),
      page,
      pageSize,
    };
  }

  async updateSlot(
    slotId: string,
    managerId: string,
    dto: UpdateSlotDto,
  ): Promise<AvailabilitySlotDto> {
    const slot = await this.prisma.availabilitySlot.findUnique({
      where: { id: slotId },
      include: { court: { include: { venue: true } } },
    });

    if (!slot) {
      throw new NotFoundException({
        code: 'SLOT_NOT_FOUND',
        message: 'Availability slot not found',
      });
    }

    if (slot.court.venue.managerId !== managerId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You do not own this availability slot',
      });
    }

    if (slot.status === AvailabilitySlotStatus.reserved && dto.status !== slot.status) {
      throw new BadRequestException({
        code: 'SLOT_RESERVED',
        message: 'Cannot modify a reserved slot',
      });
    }

    const updated = await this.prisma.availabilitySlot.update({
      where: { id: slotId },
      data: { status: dto.status },
      include: { court: { include: { venue: true } } },
    });

    return this.toDto(updated);
  }

  private toDto(
    slot: AvailabilitySlot & {
      court: { venue: { id: string; name: string } };
    },
  ): AvailabilitySlotDto {
    return {
      id: slot.id,
      courtId: slot.courtId,
      venueId: slot.court.venue.id,
      venueName: slot.court.venue.name,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      status: slot.status,
      priceCents: slot.priceCents,
    };
  }
}
