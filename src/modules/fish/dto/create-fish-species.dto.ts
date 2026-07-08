import { IsEnum, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { FishCategory } from '@prisma/client';

export class CreateFishSpeciesDto {
  @IsEnum(FishCategory, {
    message: i18nValidationMessage('fish.species_category_required'),
  })
  category: FishCategory;

  @IsString({ message: i18nValidationMessage('fish.species_name_required') })
  @MinLength(1, { message: i18nValidationMessage('fish.species_name_required') })
  nameBn: string;

  @IsString({ message: i18nValidationMessage('fish.species_name_required') })
  @MinLength(1, { message: i18nValidationMessage('fish.species_name_required') })
  nameEn: string;
}
