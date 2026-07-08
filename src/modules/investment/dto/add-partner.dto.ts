import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Matches, Max, Min, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { InvestmentMethod } from '@prisma/client';
import { BD_MOBILE_REGEX } from '../../../common/constants/mobile.constant';

export class AddPartnerDto {
  @IsString({ message: i18nValidationMessage('auth.name_required') })
  @MinLength(2, { message: i18nValidationMessage('auth.name_required') })
  name: string;

  @IsString({ message: i18nValidationMessage('auth.mobile_number_required') })
  @Matches(BD_MOBILE_REGEX, {
    message: i18nValidationMessage('auth.mobile_number_invalid'),
  })
  mobileNumber: string;

  @IsNumber({}, { message: i18nValidationMessage('investment.share_percentage_invalid') })
  @Min(0.01, { message: i18nValidationMessage('investment.share_percentage_invalid') })
  @Max(100, { message: i18nValidationMessage('investment.share_percentage_invalid') })
  sharePercentage: number;

  @IsNumber({}, { message: i18nValidationMessage('investment.initial_investment_invalid') })
  @Min(0, { message: i18nValidationMessage('investment.initial_investment_invalid') })
  initialInvestment: number;

  @IsOptional()
  @IsDateString()
  investmentDate?: string;

  @IsOptional()
  @IsEnum(InvestmentMethod)
  method?: InvestmentMethod;
}
