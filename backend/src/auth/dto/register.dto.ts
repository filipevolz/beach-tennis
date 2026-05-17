import { SkillLevel, UserRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PlayerProfileFieldsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  displayName!: string;

  @IsEnum(SkillLevel)
  skillLevel!: SkillLevel;

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string;
}

class VenueManagerProfileFieldsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  displayName!: string;
}

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @ValidateIf((o: RegisterDto) => o.role === UserRole.player)
  @ValidateNested()
  @Type(() => PlayerProfileFieldsDto)
  playerProfile?: PlayerProfileFieldsDto;

  @ValidateIf((o: RegisterDto) => o.role === UserRole.venue_manager)
  @ValidateNested()
  @Type(() => VenueManagerProfileFieldsDto)
  venueManagerProfile?: VenueManagerProfileFieldsDto;
}
