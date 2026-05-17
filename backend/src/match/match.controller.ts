import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { CreateMatchDto } from './dto/create-match.dto';
import { ListMatchesQueryDto } from './dto/list-matches-query.dto';
import { MatchService } from './match.service';

@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.player)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMatchDto) {
    return this.matchService.create(user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Query() query: ListMatchesQueryDto) {
    return this.matchService.findPublicNearby({
      latitude: query.lat,
      longitude: query.lng,
      radiusKm: query.radiusKm,
      format: query.format,
      skillLevel: query.skillLevel,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get('invite/:code')
  findByInvite(@Param('code') code: string) {
    return this.matchService.findByInviteCode(code);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.matchService.findById(id);
  }

  @Post(':id/spots/join')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.player)
  join(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.matchService.joinSpot(id, user.id);
  }

  @Post(':id/spots/leave')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.player)
  leave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.matchService.leaveSpot(id, user.id);
  }
}
