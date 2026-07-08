import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AddWithdrawalDto {
  @IsNumber({}, { message: i18nValidationMessage('investment.amount_invalid') })
  @Min(0.01, { message: i18nValidationMessage('investment.amount_invalid') })
  amount: number;

  @IsDateString({}, { message: i18nValidationMessage('investment.date_required') })
  withdrawalDate: string;

  @IsOptional()
  @IsString()
  note?: string;
}
