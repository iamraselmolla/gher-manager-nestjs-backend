import { IsOptional, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateVendorDto {
  @IsString({ message: i18nValidationMessage('feed.vendor_name_required') })
  @MinLength(1, { message: i18nValidationMessage('feed.vendor_name_required') })
  name: string;

  @IsOptional()
  @IsString()
  address?: string;
}
