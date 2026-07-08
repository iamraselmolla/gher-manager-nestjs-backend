import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateSeasonDto {
  @IsInt({ message: i18nValidationMessage('season.year_invalid') })
  @Min(2000, { message: i18nValidationMessage('season.year_invalid') })
  @Max(2100, { message: i18nValidationMessage('season.year_invalid') })
  year: number;

  @IsOptional()
  @IsString()
  label?: string;
}
