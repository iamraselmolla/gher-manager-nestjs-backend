import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SeasonsService } from '../season/season.service';
import { CreateFeedUsageDto } from './dto/create-feed-usage.dto';

export interface FeedStockLine {
  feedName: string;
  totalPurchasedBags: number;
  totalUsedBags: number;
  remainingBags: number;
}

@Injectable()
export class FeedUsageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seasonsService: SeasonsService,
  ) {}

  async create(
    projectId: string,
    seasonId: string,
    dto: CreateFeedUsageDto,
    createdByUserId: string,
  ) {
    await this.seasonsService.assertActive(seasonId);
    return this.prisma.feedUsage.create({
      data: {
        projectId,
        seasonId,
        feedName: dto.feedName,
        bagsUsed: dto.bagsUsed,
        usageDate: new Date(dto.usageDate),
        note: dto.note,
        createdByUserId,
      },
    });
  }

  async findAllForSeason(projectId: string, seasonId: string) {
    return this.prisma.feedUsage.findMany({
      where: { projectId, seasonId },
      orderBy: { usageDate: 'desc' },
    });
  }

  /**
   * "ফিড স্টক লেভেল" for the dashboard — remaining = purchased − used, grouped
   * by feed name. This is the baseline calculation the Physical Stock
   * Reconciliation module (#8) will compare a manual physical count against.
   */
  async getStockSummary(projectId: string, seasonId: string): Promise<FeedStockLine[]> {
    const [purchases, usages] = await Promise.all([
      this.prisma.feedPurchase.groupBy({
        by: ['feedName'],
        where: { projectId, seasonId },
        _sum: { bags: true },
      }),
      this.prisma.feedUsage.groupBy({
        by: ['feedName'],
        where: { projectId, seasonId },
        _sum: { bagsUsed: true },
      }),
    ]);

    const feedNames = new Set([
      ...purchases.map((p) => p.feedName),
      ...usages.map((u) => u.feedName),
    ]);

    return Array.from(feedNames).map((feedName) => {
      const totalPurchasedBags =
        purchases.find((p) => p.feedName === feedName)?._sum.bags ?? 0;
      const totalUsedBags = usages.find((u) => u.feedName === feedName)?._sum.bagsUsed ?? 0;
      return {
        feedName,
        totalPurchasedBags,
        totalUsedBags,
        remainingBags: totalPurchasedBags - totalUsedBags,
      };
    });
  }
}
