import { IsEnum } from 'class-validator';
import { Language } from '@prisma/client';

export class UpdateLanguageDto {
  @IsEnum(Language)
  preferredLanguage: Language;
}
