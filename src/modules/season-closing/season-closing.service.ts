import { BadRequestException, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Prisma, SeasonStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SeasonsService } from '../season/season.service';
import { SalesService } from '../sales/sales.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationService } from '../notification/notification.service';

export interface PartnerBreakdownLine {
  partnerId: string;
  partnerName: string;
  sharePercentage: Prisma.Decimal;
  shareOfProfitLoss: Prisma.Decimal;
  totalWithdrawals: Prisma.Decimal;
  finalSettlement: Prisma.Decimal;
}

export interface ClosingPreview {
  totalNetSales: Prisma.Decimal;
  totalExpenses: Prisma.Decimal;
  profitOrLoss: Prisma.Decimal;
  partnerBreakdown: PartnerBreakdownLine[];
}

@Injectable()
export class SeasonClosingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seasonsService: SeasonsService,
    private readonly salesService: SalesService,
    private readonly activityLogService: ActivityLogService,
    private readonly notificationService: NotificationService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Computes the full profit/loss + per-partner distribution WITHOUT
   * writing anything — this is what the Admin reviews before confirming a
   * close, per spec §5.13 ("Present a clear loss/profit percentage
   * breakdown before confirming close").
   */
  async preview(projectId: string, seasonId: string): Promise<ClosingPreview> {
    const [totalNetSales, expenseAgg, partners] = await Promise.all([
      this.salesService.totalNetSales(projectId, seasonId),
      this.prisma.expense.aggregate({
        where: { projectId, seasonId },
        _sum: { amount: true },
      }),
      this.prisma.partner.findMany({
        where: { projectId, isActive: true },
        include: { user: { select: { name: true } } },
      }),
    ]);

    const totalExpenses = expenseAgg._sum.amount ?? new Prisma.Decimal(0);
    const profitOrLoss = totalNetSales.sub(totalExpenses);

    const partnerBreakdown: PartnerBreakdownLine[] = await Promise.all(
      partners.map(async (partner) => {
        const withdrawalAgg = await this.prisma.partnerWithdrawal.aggregate({
          where: { partnerId: partner.id, seasonId },
          _sum: { amount: true },
        });
        const totalWithdrawals = withdrawalAgg._sum.amount ?? new Prisma.Decimal(0);
        const shareOfProfitLoss = profitOrLoss
          .mul(partner.sharePercentage)
          .div(100);
        const finalSettlement = shareOfProfitLoss.sub(totalWithdrawals);

        return {
          partnerId: partner.id,
          partnerName: partner.user.name,
          sharePercentage: partner.sharePercentage,
          shareOfProfitLoss,
          totalWithdrawals,
          finalSettlement,
        };
      }),
    );

    return { totalNetSales, totalExpenses, profitOrLoss, partnerBreakdown };
  }

  /**
   * Recomputes the same figures (never trusts a client-supplied preview),
   * persists them onto the Season row and one PartnerSettlement row per
   * active partner (snapshotting sharePercentage so a later share change
   * never rewrites history), then performs the mechanical close via
   * SeasonsService.close() — which is what actually makes every other
   * module's `assertActive()` check start rejecting writes.
   */
  async confirmClose(projectId: string, seasonId: string, closedByUserId: string) {
    const season = await this.seasonsService.findById(projectId, seasonId);
    if (season.status === SeasonStatus.CLOSED) {
      throw new BadRequestException(this.i18n.t('season-closing.already_closed'));
    }

    const summary = await this.preview(projectId, seasonId);

    await this.prisma.$transaction([
      this.prisma.season.update({
        where: { id: seasonId },
        data: {
          totalNetSales: summary.totalNetSales,
          totalExpenses: summary.totalExpenses,
          profitOrLoss: summary.profitOrLoss,
        },
      }),
      ...summary.partnerBreakdown.map((line) =>
        this.prisma.partnerSettlement.upsert({
          where: { seasonId_partnerId: { seasonId, partnerId: line.partnerId } },
          create: {
            seasonId,
            partnerId: line.partnerId,
            sharePercentage: line.sharePercentage,
            shareOfProfitLoss: line.shareOfProfitLoss,
            totalWithdrawals: line.totalWithdrawals,
            finalSettlement: line.finalSettlement,
          },
          update: {
            sharePercentage: line.sharePercentage,
            shareOfProfitLoss: line.shareOfProfitLoss,
            totalWithdrawals: line.totalWithdrawals,
            finalSettlement: line.finalSettlement,
          },
        }),
      ),
    ]);

    const closedSeason = await this.seasonsService.close(projectId, seasonId, closedByUserId);

    await this.activityLogService.log({
      projectId,
      seasonId,
      actionKey: 'season_closed',
      entityType: 'Season',
      entityId: seasonId,
      summary: { profitOrLoss: summary.profitOrLoss.toString() },
      actorUserId: closedByUserId,
    });

    await this.notificationService.sendToProjectMembers(
      projectId,
      {
        title: 'সিজন বন্ধ করা হয়েছে',
        body: `লাভ/ক্ষতি: ৳${summary.profitOrLoss.toString()}`,
        data: { seasonId, projectId },
      },
      { excludeUserId: closedByUserId, actionKey: 'season_closed' },
    );

    return { season: closedSeason, summary };
  }

  async getSettlements(projectId: string, seasonId: string) {
    return this.prisma.partnerSettlement.findMany({
      where: { seasonId, partner: { projectId } },
      include: { partner: { include: { user: { select: { name: true, mobileNumber: true } } } } },
    });
  }
}
