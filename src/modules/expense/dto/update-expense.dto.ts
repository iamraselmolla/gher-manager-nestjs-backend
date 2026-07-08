import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateExpenseDto {
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('expense.amount_invalid') })
  @Min(0, { message: i18nValidationMessage('expense.amount_invalid') })
  amount?: number;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
