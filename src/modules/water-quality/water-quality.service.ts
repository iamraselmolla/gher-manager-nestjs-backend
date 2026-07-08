import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Prisma, WaterQualityCheck } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SeasonsService } from '../season/season.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CreateWaterQualityCheckDto } from './dto/create-water-quality-check.dto';

@Injectable()
export class WaterQualityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seasonsService: SeasonsService,
    private readonly activityLogService: ActivityLogService,
    private readonly i18n: I18nService,
  ) {}

  async create(
    projectId: string,
    seasonId: string,
    dto: CreateWaterQualityCheckDto,
    createdByUserId: string,
  ): Promise<WaterQualityCheck> {
    await this.seasonsService.assertActive(seasonId);
    const check = await this.prisma.waterQualityCheck.create({
      data: {
        projectId,
        seasonId,
        checkDate: new Date(dto.checkDate),
        ph: dto.ph,
        temperature: dto.temperature,
        oxygen: dto.oxygen,
        ammonia: dto.ammonia,
        salinity: dto.salinity,
        note: dto.note,
        imageUrls: dto.imageUrls as unknown as Prisma.InputJsonValue,
        createdByUserId,
      },
    });

    await this.activityLogService.log({
      projectId,
      seasonId,
      actionKey: 'water_quality_checked',
      entityType: 'WaterQualityCheck',
      entityId: check.id,
      summary: { ph: dto.ph, temperature: dto.temperature, oxygen: dto.oxygen },
      actorUserId: createdByUserId,
    });

    return check;
  }

  /** Full time series for the season — client renders one trend graph per parameter. */
  async findAllForSeason(projectId: string, seasonId: string): Promise<WaterQualityCheck[]> {
    return this.prisma.waterQualityCheck.findMany({
      where: { projectId, seasonId },
      orderBy: { checkDate: 'asc' },
    });
  }

  async findLatest(projectId: string, seasonId: string): Promise<WaterQualityCheck | null> {
    return this.prisma.waterQualityCheck.findFirst({
      where: { projectId, seasonId },
      orderBy: { checkDate: 'desc' },
    });
  }

  async findById(
    projectId: string,
    seasonId: string,
    checkId: string,
  ): Promise<WaterQualityCheck> {
    const check = await this.prisma.waterQualityCheck.findFirst({
      where: { id: checkId, projectId, seasonId },
    });
    if (!check) throw new NotFoundException(this.i18n.t('water-quality.not_found'));
    return check;
  }
}
