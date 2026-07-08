import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ExpenseCategory } from '@prisma/client';

export class CreateExpenseDto {
  @IsEnum(ExpenseCategory, { message: i18nValidationMessage('expense.category_required') })
  category: ExpenseCategory;

  @IsNumber({}, { message: i18nValidationMessage('expense.amount_invalid') })
  @Min(0, { message: i18nValidationMessage('expense.amount_invalid') })
  amount: number;

  @IsDateString({}, { message: i18nValidationMessage('expense.expense_date_required') })
  expenseDate: string;

  @IsOptional()
  @IsString()
  note?: string;
}
