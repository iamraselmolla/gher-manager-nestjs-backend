import { IsOptional, IsString } from 'class-validator';

export class UpdateSeasonDto {
  @IsOptional()
  @IsString()
  label?: string;
}
