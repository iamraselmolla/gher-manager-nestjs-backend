import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateFishBatchDto {
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('fish.quantity_invalid') })
  @Min(0.01, { message: i18nValidationMessage('fish.quantity_invalid') })
  quantity?: number;

  @IsOptional()
  @IsDateString()
  stockedDate?: string;

  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('fish.cost_invalid') })
  @Min(0, { message: i18nValidationMessage('fish.cost_invalid') })
  cost?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
