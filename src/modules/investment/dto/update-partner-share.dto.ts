import { IsNumber, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdatePartnerShareDto {
  @IsNumber({}, { message: i18nValidationMessage('investment.share_percentage_invalid') })
  @Min(0.01, { message: i18nValidationMessage('investment.share_percentage_invalid') })
  @Max(100, { message: i18nValidationMessage('investment.share_percentage_invalid') })
  sharePercentage: number;
}
