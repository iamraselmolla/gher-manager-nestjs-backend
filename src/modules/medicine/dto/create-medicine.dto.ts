import { IsEnum, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { MedicineCategory } from '@prisma/client';

export class CreateMedicineDto {
  @IsEnum(MedicineCategory, {
    message: i18nValidationMessage('medicine.medicine_category_required'),
  })
  category: MedicineCategory;

  @IsString({ message: i18nValidationMessage('medicine.medicine_name_required') })
  @MinLength(1, { message: i18nValidationMessage('medicine.medicine_name_required') })
  nameBn: string;

  @IsString({ message: i18nValidationMessage('medicine.medicine_name_required') })
  @MinLength(1, { message: i18nValidationMessage('medicine.medicine_name_required') })
  nameEn: string;
}
