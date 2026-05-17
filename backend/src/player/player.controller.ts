import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../common/types/jwt-payload';
import { RolesGuard } from '../auth/roles.guard';
import { UpdatePlayerProfileDto } from './dto/update-player-profile.dto';
import { PlayerService } from './player.service';

@Controller('players')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Get('me')
  @Roles(UserRole.player)
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.playerService.getProfile(user.id);
  }

  @Patch('me')
  @Roles(UserRole.player)
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePlayerProfileDto,
  ) {
    return this.playerService.updateProfile(user.id, dto);
  }
}
