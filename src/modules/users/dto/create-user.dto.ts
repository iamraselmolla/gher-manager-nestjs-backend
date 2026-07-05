import { IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PlatformRole } from '@prisma/client';
import { BD_MOBILE_REGEX } from '../../../common/constants/mobile.constant';

export class CreateUserDto {
  @IsString({ message: i18nValidationMessage('auth.name_required') })
  @MinLength(2, { message: i18nValidationMessage('auth.name_required') })
  name: string;

  @IsString({ message: i18nValidationMessage('auth.mobile_number_required') })
  @Matches(BD_MOBILE_REGEX, {
    message: i18nValidationMessage('auth.mobile_number_invalid'),
  })
  mobileNumber: string;

  @IsOptional()
  @IsEnum(PlatformRole)
  platformRole?: PlatformRole;

  /**
   * If omitted, a random default password is generated and returned once in
   * the response (mirrors the auto-account flow the Investment module will
   * reuse for investors). Either way `mustChangePassword` is forced true.
   */
  @IsOptional()
  @IsString()
  password?: string;
}
