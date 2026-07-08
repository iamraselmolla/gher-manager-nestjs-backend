import { IsDateString, IsNumber, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateGrowthCheckDto {
  @IsDateString({}, { message: i18nValidationMessage('growth.check_date_required') })
  checkDate: string;

  @IsNumber({}, { message: i18nValidationMessage('growth.current_weight_invalid') })
  @Min(0, { message: i18nValidationMessage('growth.current_weight_invalid') })
  currentWeight: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsUrl()
  photoUrl?: string;
}
