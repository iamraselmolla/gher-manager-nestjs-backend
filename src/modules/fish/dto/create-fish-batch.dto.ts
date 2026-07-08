import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { FishCategory, QuantityUnit } from '@prisma/client';

export class CreateFishBatchDto {
  /** Provide this to use an existing catalog species. */
  @ValidateIf((dto: CreateFishBatchDto) => !dto.customSpeciesName)
  @IsString({ message: i18nValidationMessage('fish.species_or_custom_required') })
  fishSpeciesId?: string;

  /** Provide this + customSpeciesCategory instead of fishSpeciesId to add a new species inline while stocking. */
  @ValidateIf((dto: CreateFishBatchDto) => !dto.fishSpeciesId)
  @IsString({ message: i18nValidationMessage('fish.species_or_custom_required') })
  customSpeciesName?: string;

  @ValidateIf((dto: CreateFishBatchDto) => !!dto.customSpeciesName)
  @IsEnum(FishCategory, {
    message: i18nValidationMessage('fish.species_category_required'),
  })
  customSpeciesCategory?: FishCategory;

  @IsNumber({}, { message: i18nValidationMessage('fish.quantity_invalid') })
  @Min(0.01, { message: i18nValidationMessage('fish.quantity_invalid') })
  quantity: number;

  @IsOptional()
  @IsEnum(QuantityUnit)
  unit?: QuantityUnit;

  @IsDateString({}, { message: i18nValidationMessage('fish.stocked_date_required') })
  stockedDate: string;

  @IsNumber({}, { message: i18nValidationMessage('fish.cost_invalid') })
  @Min(0, { message: i18nValidationMessage('fish.cost_invalid') })
  cost: number;

  @IsOptional()
  @IsString()
  note?: string;
}
