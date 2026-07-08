import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { StockItemType } from '@prisma/client';

export class CreateStockCheckpointDto {
  @IsEnum(StockItemType, { message: i18nValidationMessage('stock-reconciliation.item_type_required') })
  itemType: StockItemType;

  /** Feed name (for FEED) or medicine id (for MEDICINE) — whatever key that item's stock is tracked under. */
  @IsString({ message: i18nValidationMessage('stock-reconciliation.item_key_required') })
  itemKey: string;

  @IsString({ message: i18nValidationMessage('stock-reconciliation.unit_required') })
  unit: string;

  @IsDateString({}, { message: i18nValidationMessage('stock-reconciliation.check_date_required') })
  checkDate: string;

  @IsNumber({}, { message: i18nValidationMessage('stock-reconciliation.physical_quantity_invalid') })
  @Min(0, { message: i18nValidationMessage('stock-reconciliation.physical_quantity_invalid') })
  physicalQuantity: number;

  @IsOptional()
  @IsString()
  note?: string;
}
