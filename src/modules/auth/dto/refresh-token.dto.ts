import { IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RefreshTokenDto {
  @IsString({ message: i18nValidationMessage('auth.refresh_token_required') })
  refreshToken: string;
}
