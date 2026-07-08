import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { StockItemType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SeasonsService } from '../season/season.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationService } from '../notification/notification.service';
import { CreateStockCheckpointDto } from './dto/create-stock-checkpoint.dto';

@Injectable()
export class StockReconciliationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seasonsService: SeasonsService,
    private readonly activityLogService: ActivityLogService,
    private readonly notificationService: NotificationService,
    private readonly i18n: I18nService,
  ) {}

  /** Sum of everything purchased/usage-logged for this item between two dates (exclusive/inclusive as noted). */
  private async sumSince(
    itemType: StockItemType,
    itemKey: string,
    projectId: string,
    seasonId: string,
    fromDateExclusive: Date,
    toDateInclusive: Date,
  ): Promise<{ purchased: number; loggedUsage: number }> {
    if (itemType === StockItemType.FEED) {
      const [purchases, usages] = await Promise.all([
        this.prisma.feedPurchase.aggregate({
          where: {
            projectId,
            seasonId,
            feedName: itemKey,
            purchaseDate: { gt: fromDateExclusive, lte: toDateInclusive },
          },
          _sum: { bags: true },
        }),
        this.prisma.feedUsage.aggregate({
          where: {
            projectId,
            seasonId,
            feedName: itemKey,
            usageDate: { gt: fromDateExclusive, lte: toDateInclusive },
          },
          _sum: { bagsUsed: true },
        }),
      ]);
      return {
        purchased: purchases._sum.bags ?? 0,
        loggedUsage: usages._sum.bagsUsed ?? 0,
      };
    }

    // MEDICINE — itemKey is a medicineId. There's no separate "usage log"
    // table; Treatment rows ARE the usage log.
    const [stocks, treatments] = await Promise.all([
      this.prisma.medicineStock.aggregate({
        where: {
          projectId,
          seasonId,
          medicineId: itemKey,
          purchaseDate: { gt: fromDateExclusive, lte: toDateInclusive },
        },
        _sum: { quantity: true },
      }),
      this.prisma.treatment.aggregate({
        where: {
          projectId,
          seasonId,
          medicineId: itemKey,
          treatmentDate: { gt: fromDateExclusive, lte: toDateInclusive },
        },
        _sum: { quantityUsed: true },
      }),
    ]);
    return {
      purchased: stocks._sum.quantity ?? 0,
      loggedUsage: treatments._sum.quantityUsed ?? 0,
    };
  }

  async create(
    projectId: string,
    seasonId: string,
    dto: CreateStockCheckpointDto,
    createdByUserId: string,
  ) {
    const season = await this.seasonsService.assertActive(seasonId);
    const checkDate = new Date(dto.checkDate);

    const previousCheckpoint = await this.prisma.stockCheckpoint.findFirst({
      where: {
        projectId,
        seasonId,
        itemType: dto.itemType,
        itemKey: dto.itemKey,
        checkDate: { lt: checkDate },
      },
      orderBy: { checkDate: 'desc' },
    });

    const referenceDate = previousCheckpoint?.checkDate ?? season.startDate;
    const previousPhysicalQuantity = previousCheckpoint?.physicalQuantity ?? 0;

    const { purchased, loggedUsage } = await this.sumSince(
      dto.itemType,
      dto.itemKey,
      projectId,
      seasonId,
      referenceDate,
      checkDate,
    );

    // "থাকার কথা" — what the books say should remain.
    const expectedRemainingQuantity = previousPhysicalQuantity + purchased - loggedUsage;
    // True consumption implied by physical counts alone, ignoring what was logged.
    const actualConsumedQuantity =
      previousPhysicalQuantity + purchased - dto.physicalQuantity;
    // Positive = consumed more than logged (possible wastage/theft/unlogged usage).
    const discrepancy = expectedRemainingQuantity - dto.physicalQuantity;

    const checkpoint = await this.prisma.stockCheckpoint.create({
      data: {
        projectId,
        seasonId,
        itemType: dto.itemType,
        itemKey: dto.itemKey,
        unit: dto.unit,
        checkDate,
        physicalQuantity: dto.physicalQuantity,
        previousPhysicalQuantity,
        purchasedSinceLastCheck: purchased,
        loggedUsageSinceLastCheck: loggedUsage,
        expectedRemainingQuantity,
        actualConsumedQuantity,
        discrepancy,
        note: dto.note,
        createdByUserId,
      },
    });

    await this.activityLogService.log({
      projectId,
      seasonId,
      actionKey: 'stock_checkpoint_added',
      entityType: 'StockCheckpoint',
      entityId: checkpoint.id,
      summary: { itemType: dto.itemType, itemKey: dto.itemKey, discrepancy },
      actorUserId: createdByUserId,
    });

    await this.notificationService.sendToProjectMembers(
      projectId,
      {
        title: 'স্টক পরীক্ষা করা হয়েছে',
        body:
          Math.abs(discrepancy) > 0
            ? `${dto.itemKey} — পার্থক্য: ${discrepancy}`
            : `${dto.itemKey} — কোনো পার্থক্য নেই`,
        data: { stockCheckpointId: checkpoint.id, projectId },
      },
      { excludeUserId: createdByUserId, actionKey: 'stock_checkpoint_added' },
    );

    return checkpoint;
  }

  async findAllForItem(
    projectId: string,
    seasonId: string,
    itemType: StockItemType,
    itemKey: string,
  ) {
    return this.prisma.stockCheckpoint.findMany({
      where: { projectId, seasonId, itemType, itemKey },
      orderBy: { checkDate: 'asc' },
    });
  }

  async findAllForSeason(projectId: string, seasonId: string) {
    return this.prisma.stockCheckpoint.findMany({
      where: { projectId, seasonId },
      orderBy: { checkDate: 'desc' },
    });
  }

  async findById(projectId: string, seasonId: string, checkpointId: string) {
    const checkpoint = await this.prisma.stockCheckpoint.findFirst({
      where: { id: checkpointId, projectId, seasonId },
    });
    if (!checkpoint) {
      throw new NotFoundException(this.i18n.t('stock-reconciliation.checkpoint_not_found'));
    }
    return checkpoint;
  }
}
