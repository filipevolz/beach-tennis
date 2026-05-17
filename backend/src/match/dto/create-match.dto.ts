import { MatchFormat, MatchVisibility, SkillLevel } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMatchDto {
  @IsEnum(MatchFormat)
  format!: MatchFormat;

  @IsEnum(MatchVisibility)
  visibility!: MatchVisibility;

  @IsEnum(SkillLevel)
  skillLevel!: SkillLevel;

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
