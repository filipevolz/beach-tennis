import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../common/types/jwt-payload';
import { RolesGuard } from '../auth/roles.guard';
import { AvailabilityService } from './availability.service';
import { ListSlotsQueryDto } from './dto/list-slots-query.dto';
import { PublishSlotDto } from './dto/publish-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post('venues/:venueId/availability-slots')
  @Roles(UserRole.venue_manager)
  publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('venueId', ParseUUIDPipe) venueId: string,
    @Body() dto: PublishSlotDto,
  ) {
    return this.availabilityService.publish(venueId, user.id, dto);
  }

  @Get('availability-slots')
  list(@Query() query: ListSlotsQueryDto) {
    return this.availabilityService.findNearby(query);
  }

  @Patch('availability-slots/:id')
  @Roles(UserRole.venue_manager)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSlotDto,
  ) {
    return this.availabilityService.updateSlot(id, user.id, dto);
  }
}
