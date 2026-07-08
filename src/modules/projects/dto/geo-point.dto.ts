import { IsNumber, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class GeoPointDto {
  @IsNumber({}, { message: i18nValidationMessage('project.gps_lat_invalid') })
  @Min(-90, { message: i18nValidationMessage('project.gps_lat_invalid') })
  @Max(90, { message: i18nValidationMessage('project.gps_lat_invalid') })
  lat: number;

  @IsNumber({}, { message: i18nValidationMessage('project.gps_lng_invalid') })
  @Min(-180, { message: i18nValidationMessage('project.gps_lng_invalid') })
  @Max(180, { message: i18nValidationMessage('project.gps_lng_invalid') })
  lng: number;
}
