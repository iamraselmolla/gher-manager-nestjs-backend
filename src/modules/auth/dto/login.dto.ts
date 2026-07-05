import { Matches, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { BD_MOBILE_REGEX } from '../../../common/constants/mobile.constant';

export class LoginDto {
  @IsString({ message: i18nValidationMessage('auth.mobile_number_required') })
  @Matches(BD_MOBILE_REGEX, {
    message: i18nValidationMessage('auth.mobile_number_invalid'),
  })
  mobileNumber: string;

  @IsString({ message: i18nValidationMessage('auth.password_required') })
  @MinLength(1, { message: i18nValidationMessage('auth.password_required') })
  password: string;
}
