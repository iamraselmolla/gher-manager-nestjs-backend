import { IsInt, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateAdminSettingDto {
  @IsInt({ message: i18nValidationMessage('notification.lead_days_invalid') })
  @Min(0, { message: i18nValidationMessage('notification.lead_days_invalid') })
  followUpReminderLeadDays: number;
}
