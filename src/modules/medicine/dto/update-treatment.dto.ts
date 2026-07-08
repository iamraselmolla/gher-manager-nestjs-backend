import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateTreatmentDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpDate?: string;
}
