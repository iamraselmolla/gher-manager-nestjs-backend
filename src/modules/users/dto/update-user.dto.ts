import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PlatformRole } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: i18nValidationMessage('auth.name_required') })
  @MinLength(2, { message: i18nValidationMessage('auth.name_required') })
  name?: string;

  @IsOptional()
  @IsEnum(PlatformRole)
  platformRole?: PlatformRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
