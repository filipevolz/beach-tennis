import { AvailabilitySlotStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateSlotDto {
  @IsEnum(AvailabilitySlotStatus)
  status!: AvailabilitySlotStatus;
}
