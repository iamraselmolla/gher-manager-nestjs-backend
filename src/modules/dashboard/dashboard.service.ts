import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { SeasonsService } from '../season/season.service';
import { FishBatchService } from '../fish/fish-batch.service';
import { FeedUsageService } from '../feed/feed-usage.service';
import { MedicineStockService } from '../medicine/medicine-stock.service';
import { TreatmentService } from '../medicine/treatment.service';
import { WaterQualityService } from '../water-quality/water-quality.service';
import { SalesService } from '../sales/sales.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

const CACHE_TTL_SECONDS = 60;

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly seasonsService: SeasonsService,
    private readonly fishBatchService: FishBatchService,
    private readonly feedUsageService: FeedUsageService,
    private readonly medicineStockService: MedicineStockService,
    private readonly treatmentService: TreatmentService,
    private readonly waterQualityService: WaterQualityService,
    private readonly salesService: SalesService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private startOfToday(): Date {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  private startOfMonth(): Date {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Cached for 60s per project+season — a short TTL is a deliberately
   * simpler alternative to wiring cache-invalidation hooks into every write
   * path across 16 other modules; for a dashboard (read-heavy, tolerates a
   * few seconds of staleness) this is a reasonable trade documented here
   * rather than a shortcut taken silently.
   */
  async getDashboard(projectId: string, seasonId: string) {
    return this.redis.getOrSet(
      `dashboard:${projectId}:${seasonId}`,
      CACHE_TTL_SECONDS,
      () => this.compute(projectId, seasonId),
    );
  }

  private async compute(projectId: string, seasonId: string) {
    const todayStart = this.startOfToday();
    const monthStart = this.startOfMonth();

    const [
      season,
      fishBatches,
      recentGrowthChecks,
      feedStockLevels,
      medicineStockLevels,
      latestWaterQuality,
      todayExpenseAgg,
      monthExpenseAgg,
      totalNetSales,
      investmentAgg,
      treatments,
      upcomingFollowUps,
      recentActivity,
    ] = await Promise.all([
      this.seasonsService.findById(projectId, seasonId),
      this.fishBatchService.findAllForSeason(projectId, seasonId),
      this.prisma.growthCheck.findMany({
        where: { fishBatch: { projectId, seasonId } },
        orderBy: { checkDate: 'desc' },
        take: 10,
      }),
      this.feedUsageService.getStockSummary(projectId, seasonId),
      this.medicineStockService.getStockSummary(projectId, seasonId),
      this.waterQualityService.findLatest(projectId, seasonId),
      this.prisma.expense.aggregate({
        where: { projectId, seasonId, expenseDate: { gte: todayStart } },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: { projectId, seasonId, expenseDate: { gte: monthStart } },
        _sum: { amount: true },
      }),
      this.salesService.totalNetSales(projectId, seasonId),
      this.prisma.partnerInvestment.aggregate({
        where: { seasonId, partner: { projectId } },
        _sum: { amount: true },
      }),
      this.treatmentService.findAllForSeason(projectId, seasonId),
      this.treatmentService.findUpcomingFollowUps(projectId, seasonId),
      this.activityLogService.findAllForProject(projectId, { seasonId, limit: 20 }),
    ]);

    return {
      season,
      fish: {
        batches: fishBatches,
        recentGrowthChecks,
      },
      feedStockLevels,
      medicineStockLevels,
      latestWaterQuality,
      expenses: {
        today: todayExpenseAgg._sum.amount ?? new Prisma.Decimal(0),
        thisMonth: monthExpenseAgg._sum.amount ?? new Prisma.Decimal(0),
      },
      totalNetSales,
      totalInvestment: investmentAgg._sum.amount ?? new Prisma.Decimal(0),
      treatmentHistory: treatments.slice(0, 10),
      upcomingFollowUps,
      activityTimeline: recentActivity,
      generatedAt: new Date().toISOString(),
    };
  }
}
