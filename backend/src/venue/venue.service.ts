import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Court, Venue } from '@prisma/client';
import { getVenueLocation, setVenueLocation } from '../common/utils/geo';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';

export interface VenueDto {
  id: string;
  managerId: string;
  name: string;
  address: string;
  description: string | null;
  location: { latitude: number; longitude: number } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourtDto {
  id: string;
  venueId: string;
  name: string;
  surface: string | null;
}

@Injectable()
export class VenueService {
  constructor(private readonly prisma: PrismaService) {}

  async create(managerId: string, dto: CreateVenueDto): Promise<VenueDto> {
    const venue = await this.prisma.venue.create({
      data: {
        managerId,
        name: dto.name,
        address: dto.address,
        description: dto.description,
      },
    });

    await setVenueLocation(this.prisma, venue.id, dto.latitude, dto.longitude);
    return this.toVenueDto(venue);
  }

  async findOwnVenue(managerId: string): Promise<VenueDto> {
    const venue = await this.prisma.venue.findFirst({
      where: { managerId },
      orderBy: { createdAt: 'asc' },
    });

    if (!venue) {
      throw new NotFoundException({
        code: 'VENUE_NOT_FOUND',
        message: 'Venue not found for this manager',
      });
    }

    return this.toVenueDto(venue);
  }

  async update(
    venueId: string,
    managerId: string,
    dto: UpdateVenueDto,
  ): Promise<VenueDto> {
    await this.assertOwner(venueId, managerId);

    if (
      (dto.latitude !== undefined && dto.longitude === undefined) ||
      (dto.longitude !== undefined && dto.latitude === undefined)
    ) {
      throw new BadRequestException({
        code: 'INVALID_LOCATION',
        message: 'Both latitude and longitude are required to update location',
      });
    }

    const venue = await this.prisma.venue.update({
      where: { id: venueId },
      data: {
        name: dto.name,
        address: dto.address,
        description: dto.description,
      },
    });

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      await setVenueLocation(this.prisma, venueId, dto.latitude, dto.longitude);
    }

    return this.toVenueDto(venue);
  }

  async addCourt(
    venueId: string,
    managerId: string,
    dto: CreateCourtDto,
  ): Promise<CourtDto> {
    await this.assertOwner(venueId, managerId);

    const court = await this.prisma.court.create({
      data: {
        venueId,
        name: dto.name,
        surface: dto.surface,
      },
    });

    return this.toCourtDto(court);
  }

  async listCourts(venueId: string): Promise<CourtDto[]> {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) {
      throw new NotFoundException({
        code: 'VENUE_NOT_FOUND',
        message: 'Venue not found',
      });
    }

    const courts = await this.prisma.court.findMany({
      where: { venueId },
      orderBy: { name: 'asc' },
    });

    return courts.map((court) => this.toCourtDto(court));
  }

  async assertOwner(venueId: string, managerId: string): Promise<Venue> {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) {
      throw new NotFoundException({
        code: 'VENUE_NOT_FOUND',
        message: 'Venue not found',
      });
    }

    if (venue.managerId !== managerId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You do not own this venue',
      });
    }

    return venue;
  }

  private async toVenueDto(venue: Venue): Promise<VenueDto> {
    const location = await getVenueLocation(this.prisma, venue.id);
    return {
      id: venue.id,
      managerId: venue.managerId,
      name: venue.name,
      address: venue.address,
      description: venue.description,
      location,
      createdAt: venue.createdAt,
      updatedAt: venue.updatedAt,
    };
  }

  private toCourtDto(court: Court): CourtDto {
    return {
      id: court.id,
      venueId: court.venueId,
      name: court.name,
      surface: court.surface,
    };
  }
}
