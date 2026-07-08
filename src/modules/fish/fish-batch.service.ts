import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ExpenseCategory, ExpenseSourceType, FishBatch } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SeasonsService } from '../season/season.service';
import { FishSpeciesService } from './fish-species.service';
import { ExpenseService } from '../expense/expense.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CreateFishBatchDto } from './dto/create-fish-batch.dto';
import { UpdateFishBatchDto } from './dto/update-fish-batch.dto';

const MS_PER_DAY = 86_400_000;

export type FishBatchWithAge = FishBatch & { ageInDays: number };

@Injectable()
export class FishBatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seasonsService: SeasonsService,
    private readonly speciesService: FishSpeciesService,
    private readonly expenseService: ExpenseService,
    private readonly activityLogService: ActivityLogService,
    private readonly i18n: I18nService,
  ) {}

  /** Age is derived here, never stored — always correct as of "now" with no sync job needed. */
  private withAge(batch: FishBatch): FishBatchWithAge {
    const ageInDays = Math.max(
      0,
      Math.floor((Date.now() - batch.stockedDate.getTime()) / MS_PER_DAY),
    );
    return { ...batch, ageInDays };
  }

  async create(
    projectId: string,
    seasonId: string,
    dto: CreateFishBatchDto,
    createdByUserId: string,
  ): Promise<FishBatchWithAge> {
    await this.seasonsService.assertActive(seasonId);

    const fishSpeciesId = dto.fishSpeciesId
      ? dto.fishSpeciesId
      : (
          await this.speciesService.findOrCreateCustom(
            dto.customSpeciesName!,
            dto.customSpeciesCategory!,
            createdByUserId,
          )
        ).id;

    const batch = await this.prisma.fishBatch.create({
      data: {
        projectId,
        seasonId,
        fishSpeciesId,
        quantity: dto.quantity,
        unit: dto.unit,
        stockedDate: new Date(dto.stockedDate),
        cost: dto.cost,
        note: dto.note,
        createdByUserId,
      },
    });

    await this.expenseService.upsertFromSource({
      projectId,
      seasonId,
      category: ExpenseCategory.FISH_STOCKING,
      amount: dto.cost,
      expenseDate: batch.stockedDate,
      note: dto.note,
      sourceType: ExpenseSourceType.FISH_BATCH,
      sourceId: batch.id,
      createdByUserId,
    });

    await this.activityLogService.log({
      projectId,
      seasonId,
      actionKey: 'fish_batch_added',
      entityType: 'FishBatch',
      entityId: batch.id,
      summary: { quantity: dto.quantity, unit: dto.unit, cost: dto.cost },
      actorUserId: createdByUserId,
    });

    return this.withAge(batch);
  }

  async findAllForSeason(projectId: string, seasonId: string): Promise<FishBatchWithAge[]> {
    const batches = await this.prisma.fishBatch.findMany({
      where: { projectId, seasonId },
      include: { fishSpecies: true },
      orderBy: { stockedDate: 'desc' },
    });
    return batches.map((b) => this.withAge(b));
  }

  async findById(projectId: string, seasonId: string, batchId: string): Promise<FishBatchWithAge> {
    const batch = await this.prisma.fishBatch.findFirst({
      where: { id: batchId, projectId, seasonId },
      include: { fishSpecies: true },
    });
    if (!batch) {
      throw new NotFoundException(this.i18n.t('fish.batch_not_found'));
    }
    return this.withAge(batch);
  }

  async update(
    projectId: string,
    seasonId: string,
    batchId: string,
    dto: UpdateFishBatchDto,
  ): Promise<FishBatchWithAge> {
    await this.seasonsService.assertActive(seasonId);
    await this.findById(projectId, seasonId, batchId);

    const batch = await this.prisma.fishBatch.update({
      where: { id: batchId },
      data: {
        quantity: dto.quantity,
        stockedDate: dto.stockedDate ? new Date(dto.stockedDate) : undefined,
        cost: dto.cost,
        note: dto.note,
      },
    });

    if (dto.cost !== undefined || dto.stockedDate !== undefined || dto.note !== undefined) {
      await this.expenseService.upsertFromSource({
        projectId,
        seasonId,
        category: ExpenseCategory.FISH_STOCKING,
        amount: dto.cost ?? batch.cost.toNumber(),
        expenseDate: batch.stockedDate,
        note: dto.note,
        sourceType: ExpenseSourceType.FISH_BATCH,
        sourceId: batch.id,
        createdByUserId: batch.createdByUserId,
      });
    }

    return this.withAge(batch);
  }
}
