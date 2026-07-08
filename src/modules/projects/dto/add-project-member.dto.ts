import { IsEnum, IsString, Matches } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ProjectRole } from '@prisma/client';
import { BD_MOBILE_REGEX } from '../../../common/constants/mobile.constant';

export class AddProjectMemberDto {
  @IsString({ message: i18nValidationMessage('auth.mobile_number_required') })
  @Matches(BD_MOBILE_REGEX, {
    message: i18nValidationMessage('auth.mobile_number_invalid'),
  })
  mobileNumber: string;

  @IsEnum(ProjectRole)
  role: ProjectRole;
}
