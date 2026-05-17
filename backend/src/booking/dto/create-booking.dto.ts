import { IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  matchId!: string;

  @IsUUID()
  availabilitySlotId!: string;
}
