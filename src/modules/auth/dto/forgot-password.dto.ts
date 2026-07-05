import { Matches, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { BD_MOBILE_REGEX } from '../../../common/constants/mobile.constant';

export class ForgotPasswordDto {
  @IsString({ message: i18nValidationMessage('auth.mobile_number_required') })
  @Matches(BD_MOBILE_REGEX, {
    message: i18nValidationMessage('auth.mobile_number_invalid'),
  })
  mobileNumber: string;
}
