import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../common/types/jwt-payload';
import { RolesGuard } from '../auth/roles.guard';
import { CreateCourtDto } from './dto/create-court.dto';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { VenueService } from './venue.service';

@Controller('venues')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

  @Post()
  @Roles(UserRole.venue_manager)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateVenueDto) {
    return this.venueService.create(user.id, dto);
  }

  @Get('me')
  @Roles(UserRole.venue_manager)
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.venueService.findOwnVenue(user.id);
  }

  @Patch(':id')
  @Roles(UserRole.venue_manager)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVenueDto,
  ) {
    return this.venueService.update(id, user.id, dto);
  }

  @Post(':id/courts')
  @Roles(UserRole.venue_manager)
  addCourt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCourtDto,
  ) {
    return this.venueService.addCourt(id, user.id, dto);
  }

  @Get(':id/courts')
  listCourts(@Param('id', ParseUUIDPipe) id: string) {
    return this.venueService.listCourts(id);
  }
}
