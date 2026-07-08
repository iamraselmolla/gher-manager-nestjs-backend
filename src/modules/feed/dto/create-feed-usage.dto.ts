import { IsDateString, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateFeedUsageDto {
  @IsString({ message: i18nValidationMessage('feed.feed_name_required') })
  @MinLength(1, { message: i18nValidationMessage('feed.feed_name_required') })
  feedName: string;

  @IsNumber({}, { message: i18nValidationMessage('feed.bags_invalid') })
  @Min(0.01, { message: i18nValidationMessage('feed.bags_invalid') })
  bagsUsed: number;

  @IsDateString({}, { message: i18nValidationMessage('feed.purchase_date_required') })
  usageDate: string;

  @IsOptional()
  @IsString()
  note?: string;
}
