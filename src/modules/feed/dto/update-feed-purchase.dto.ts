import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateFeedPurchaseDto {
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('feed.bags_invalid') })
  @Min(0.01, { message: i18nValidationMessage('feed.bags_invalid') })
  bags?: number;

  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('feed.price_per_bag_invalid') })
  @Min(0, { message: i18nValidationMessage('feed.price_per_bag_invalid') })
  pricePerBag?: number;

  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('feed.paid_amount_invalid') })
  @Min(0, { message: i18nValidationMessage('feed.paid_amount_invalid') })
  paidAmount?: number;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
