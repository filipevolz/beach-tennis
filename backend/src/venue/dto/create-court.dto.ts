import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCourtDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  surface?: string;
}
