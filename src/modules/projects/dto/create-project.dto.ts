import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { LandUnit } from '@prisma/client';
import { GeoPointDto } from './geo-point.dto';

export class CreateProjectDto {
  @IsString({ message: i18nValidationMessage('project.name_required') })
  @MinLength(2, { message: i18nValidationMessage('project.name_required') })
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('project.gps_lat_invalid') })
  @Min(-90, { message: i18nValidationMessage('project.gps_lat_invalid') })
  @Max(90, { message: i18nValidationMessage('project.gps_lat_invalid') })
  gpsLat?: number;

  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('project.gps_lng_invalid') })
  @Min(-180, { message: i18nValidationMessage('project.gps_lng_invalid') })
  @Max(180, { message: i18nValidationMessage('project.gps_lng_invalid') })
  gpsLng?: number;

  /** Pond shape — vertices in order, minimum 3 to form a polygon. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(3, { message: i18nValidationMessage('project.boundary_polygon_invalid') })
  @ValidateNested({ each: true })
  @Type(() => GeoPointDto)
  boundaryPolygon?: GeoPointDto[];

  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('project.land_area_invalid') })
  @Min(0, { message: i18nValidationMessage('project.land_area_invalid') })
  landArea?: number;

  @IsOptional()
  @IsEnum(LandUnit)
  landAreaUnit?: LandUnit;

  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('project.lease_amount_invalid') })
  @Min(0, { message: i18nValidationMessage('project.lease_amount_invalid') })
  leaseAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  leaseDurationYears?: number;

  @IsOptional()
  @IsDateString()
  leaseStartDate?: string;

  @IsOptional()
  @IsDateString()
  leaseEndDate?: string;

  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('project.lease_amount_invalid') })
  @Min(0, { message: i18nValidationMessage('project.lease_amount_invalid') })
  leaseAdvancePaid?: number;

  @IsOptional()
  @IsString()
  landOwnerName?: string;

  @IsOptional()
  @IsString()
  landOwnerAddress?: string;
}
