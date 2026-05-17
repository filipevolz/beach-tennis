import { SkillLevel } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdatePlayerProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsEnum(SkillLevel)
  skillLevel?: SkillLevel;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string | null;

  @ValidateIf((o: UpdatePlayerProfileDto) => o.latitude !== undefined || o.longitude !== undefined)
  @IsNumber()
  latitude?: number;

  @ValidateIf((o: UpdatePlayerProfileDto) => o.latitude !== undefined || o.longitude !== undefined)
  @IsNumber()
  longitude?: number;
}
