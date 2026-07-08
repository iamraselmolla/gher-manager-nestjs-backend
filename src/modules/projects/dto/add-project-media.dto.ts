import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { MediaType } from '@prisma/client';

export class AddProjectMediaDto {
  @IsString({ message: i18nValidationMessage('project.media_url_required') })
  @IsUrl({}, { message: i18nValidationMessage('project.media_url_required') })
  url: string;

  @IsEnum(MediaType, { message: i18nValidationMessage('project.media_type_required') })
  type: MediaType;

  @IsOptional()
  @IsString()
  caption?: string;
}
