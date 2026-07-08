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

export class CreateMedicineStockDto {
  @ValidateIf((dto: CreateMedicineStockDto) => !dto.customMedicineName)
  @IsString({ message: i18nValidationMessage('medicine.medicine_or_custom_required') })
  medicineId?: string;

  @ValidateIf((dto: CreateMedicineStockDto) => !dto.medicineId)
  @IsString({ message: i18nValidationMessage('medicine.medicine_or_custom_required') })
  customMedicineName?: string;

  @ValidateIf((dto: CreateMedicineStockDto) => !!dto.customMedicineName)
  @IsEnum(MedicineCategory, {
    message: i18nValidationMessage('medicine.medicine_category_required'),
  })
  customMedicineCategory?: MedicineCategory;

  @IsNumber({}, { message: i18nValidationMessage('medicine.quantity_invalid') })
  @Min(0.01, { message: i18nValidationMessage('medicine.quantity_invalid') })
  quantity: number;

  @IsString({ message: i18nValidationMessage('medicine.unit_required') })
  unit: string;

  @IsNumber({}, { message: i18nValidationMessage('medicine.cost_invalid') })
  @Min(0, { message: i18nValidationMessage('medicine.cost_invalid') })
  cost: number;

  @IsDateString({}, { message: i18nValidationMessage('medicine.purchase_date_required') })
  purchaseDate: string;

  @IsOptional()
  @IsString()
  note?: string;
}
