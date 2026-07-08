import { IsDateString, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateFeedPurchaseDto {
  @IsString({ message: i18nValidationMessage('feed.vendor_not_found') })
  vendorId: string;

  @IsString({ message: i18nValidationMessage('feed.feed_name_required') })
  @MinLength(1, { message: i18nValidationMessage('feed.feed_name_required') })
  feedName: string;

  @IsNumber({}, { message: i18nValidationMessage('feed.bags_invalid') })
  @Min(0.01, { message: i18nValidationMessage('feed.bags_invalid') })
  bags: number;

  @IsNumber({}, { message: i18nValidationMessage('feed.price_per_bag_invalid') })
  @Min(0, { message: i18nValidationMessage('feed.price_per_bag_invalid') })
  pricePerBag: number;

  @IsNumber({}, { message: i18nValidationMessage('feed.paid_amount_invalid') })
  @Min(0, { message: i18nValidationMessage('feed.paid_amount_invalid') })
  paidAmount: number;

  @IsDateString({}, { message: i18nValidationMessage('feed.purchase_date_required') })
  purchaseDate: string;

  @IsOptional()
  @IsString()
  note?: string;
}
