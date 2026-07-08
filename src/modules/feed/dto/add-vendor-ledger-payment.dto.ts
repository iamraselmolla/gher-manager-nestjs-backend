import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AddVendorLedgerPaymentDto {
  @IsNumber({}, { message: i18nValidationMessage('feed.payment_amount_invalid') })
  @Min(0.01, { message: i18nValidationMessage('feed.payment_amount_invalid') })
  amount: number;

  @IsDateString({}, { message: i18nValidationMessage('feed.payment_date_required') })
  paymentDate: string;

  @IsOptional()
  @IsString()
  note?: string;
}
