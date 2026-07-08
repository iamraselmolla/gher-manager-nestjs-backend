import { IsIn, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RegisterDeviceTokenDto {
  @IsString({ message: i18nValidationMessage('notification.token_required') })
  token: string;

  @IsOptional()
  @IsIn(['ios', 'android', 'web'])
  platform?: string;
}
