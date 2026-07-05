import { IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { IsStrongPassword } from '../../../common/decorators/is-strong-password.decorator';

export class ChangePasswordDto {
  @IsString({
    message: i18nValidationMessage('auth.current_password_required'),
  })
  currentPassword: string;

  @IsStrongPassword()
  newPassword: string;
}
