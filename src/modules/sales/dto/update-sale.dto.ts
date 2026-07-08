import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateSaleDto {
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('sales.quantity_invalid') })
  @Min(0.01, { message: i18nValidationMessage('sales.quantity_invalid') })
  quantityKg?: number;

  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('sales.gross_amount_invalid') })
  @Min(0, { message: i18nValidationMessage('sales.gross_amount_invalid') })
  grossAmount?: number;

  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('sales.related_cost_invalid') })
  @Min(0, { message: i18nValidationMessage('sales.related_cost_invalid') })
  relatedCost?: number;

  @IsOptional()
  @IsDateString()
  saleDate?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
