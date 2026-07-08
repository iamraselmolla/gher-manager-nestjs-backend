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
import { MedicineCategory } from '@prisma/client';

export class CreateTreatmentDto {
  @ValidateIf((dto: CreateTreatmentDto) => !dto.customMedicineName)
  @IsString({ message: i18nValidationMessage('medicine.medicine_or_custom_required') })
  medicineId?: string;

  @ValidateIf((dto: CreateTreatmentDto) => !dto.medicineId)
  @IsString({ message: i18nValidationMessage('medicine.medicine_or_custom_required') })
  customMedicineName?: string;

  @ValidateIf((dto: CreateTreatmentDto) => !!dto.customMedicineName)
  @IsEnum(MedicineCategory, {
    message: i18nValidationMessage('medicine.medicine_category_required'),
  })
  customMedicineCategory?: MedicineCategory;

  @IsDateString({}, { message: i18nValidationMessage('medicine.treatment_date_required') })
  treatmentDate: string;

  @IsNumber({}, { message: i18nValidationMessage('medicine.quantity_invalid') })
  @Min(0.01, { message: i18nValidationMessage('medicine.quantity_invalid') })
  quantityUsed: number;

  @IsString({ message: i18nValidationMessage('medicine.unit_required') })
  unit: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpDate?: string;
}
