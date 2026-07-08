import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../prisma/prisma.service';
import { SeasonsService } from '../season/season.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CreateGrowthCheckDto } from './dto/create-growth-check.dto';

const MS_PER_DAY = 86_400_000;

@Injectable()
export class GrowthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seasonsService: SeasonsService,
    private readonly activityLogService: ActivityLogService,
    private readonly i18n: I18nService,
  ) {}

  private async assertBatchExists(projectId: string, seasonId: string, fishBatchId: string) {
    const batch = await this.prisma.fishBatch.findFirst({
      where: { id: fishBatchId, projectId, seasonId },
    });
    if (!batch) throw new NotFoundException(this.i18n.t('growth.batch_not_found'));
    return batch;
  }

  async create(
    projectId: string,
    seasonId: string,
    fishBatchId: string,
    dto: CreateGrowthCheckDto,
    recordedByUserId: string,
  ) {
    await this.seasonsService.assertActive(seasonId);
    const batch = await this.assertBatchExists(projectId, seasonId, fishBatchId);
    const checkDate = new Date(dto.checkDate);

    // Most recent prior check for this batch, before this checkDate — this
    // is what "previous weight" and the day interval are computed against.
    const previousCheck = await this.prisma.growthCheck.findFirst({
      where: { fishBatchId, checkDate: { lt: checkDate } },
      orderBy: { checkDate: 'desc' },
    });

    const previousWeight = previousCheck?.currentWeight ?? null;
    const growthAmount = previousWeight !== null ? dto.currentWeight - previousWeight : null;
    const referenceDate = previousCheck?.checkDate ?? batch.stockedDate;
    const daysSinceLastCheck = Math.max(
      0,
      Math.round((checkDate.getTime() - referenceDate.getTime()) / MS_PER_DAY),
    );

    const check = await this.prisma.growthCheck.create({
      data: {
        fishBatchId,
        checkDate,
        currentWeight: dto.currentWeight,
        previousWeight,
        growthAmount,
        daysSinceLastCheck,
        comment: dto.comment,
        photoUrl: dto.photoUrl,
        recordedByUserId,
      },
    });

    await this.activityLogService.log({
      projectId,
      seasonId,
      actionKey: 'growth_check_added',
      entityType: 'GrowthCheck',
      entityId: check.id,
      summary: { currentWeight: dto.currentWeight, growthAmount },
      actorUserId: recordedByUserId,
    });

    return check;
  }

  async findAllForBatch(projectId: string, seasonId: string, fishBatchId: string) {
    await this.assertBatchExists(projectId, seasonId, fishBatchId);
    return this.prisma.growthCheck.findMany({
      where: { fishBatchId },
      orderBy: { checkDate: 'asc' },
    });
  }

  /** Season-wide feed for the "growth trend graph per species per season" view — group by fishSpecies client-side. */
  async findAllForSeason(projectId: string, seasonId: string) {
    return this.prisma.growthCheck.findMany({
      where: { fishBatch: { projectId, seasonId } },
      include: { fishBatch: { include: { fishSpecies: true } } },
      orderBy: { checkDate: 'asc' },
    });
  }

  async remove(projectId: string, seasonId: string, fishBatchId: string, checkId: string) {
    await this.seasonsService.assertActive(seasonId);
    await this.assertBatchExists(projectId, seasonId, fishBatchId);
    const check = await this.prisma.growthCheck.findFirst({
      where: { id: checkId, fishBatchId },
    });
    if (!check) throw new NotFoundException(this.i18n.t('growth.check_not_found'));
    await this.prisma.growthCheck.delete({ where: { id: checkId } });
    return { removed: true };
  }
}
