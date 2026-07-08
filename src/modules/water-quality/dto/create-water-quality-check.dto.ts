import { IsArray, IsDateString, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateWaterQualityCheckDto {
  @IsDateString({}, { message: i18nValidationMessage('water-quality.check_date_required') })
  checkDate: string;

  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('water-quality.value_invalid') })
  ph?: number;

  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('water-quality.value_invalid') })
  temperature?: number;

  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('water-quality.value_invalid') })
  oxygen?: number;

  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('water-quality.value_invalid') })
  ammonia?: number;

  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('water-quality.value_invalid') })
  salinity?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  imageUrls?: string[];
}
