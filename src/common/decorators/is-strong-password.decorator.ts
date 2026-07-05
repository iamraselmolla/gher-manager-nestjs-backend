import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * Applied to any "new password" field (change-password, reset-password,
 * admin-set password). Kept intentionally simple — 8+ chars, at least one
 * letter and one digit — since this is a farm-operations tool used by
 * non-technical field staff, not a high-security banking app.
 */
export function IsStrongPassword() {
  return applyDecorators(
    IsString({ message: i18nValidationMessage('auth.new_password_required') }),
    MinLength(8, { message: i18nValidationMessage('auth.password_min_length') }),
    Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
      message: i18nValidationMessage('auth.password_weak'),
    }),
  );
}
