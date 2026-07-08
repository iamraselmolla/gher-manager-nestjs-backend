import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { InvestmentMethod } from '@prisma/client';

export class AddInvestmentDto {
  @IsNumber({}, { message: i18nValidationMessage('investment.amount_invalid') })
  @Min(0.01, { message: i18nValidationMessage('investment.amount_invalid') })
  amount: number;

  @IsDateString({}, { message: i18nValidationMessage('investment.date_required') })
  investmentDate: string;

  @IsOptional()
  @IsEnum(InvestmentMethod)
  method?: InvestmentMethod;

  @IsOptional()
  @IsString()
  note?: string;
}
