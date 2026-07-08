import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { InvestmentMethod, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SeasonsService } from '../season/season.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationService } from '../notification/notification.service';
import { AddInvestmentDto } from './dto/add-investment.dto';
import { AddWithdrawalDto } from './dto/add-withdrawal.dto';

@Injectable()
export class PartnerLedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seasonsService: SeasonsService,
    private readonly activityLogService: ActivityLogService,
    private readonly notificationService: NotificationService,
    private readonly i18n: I18nService,
  ) {}

  private async findPartnerOrThrow(projectId: string, partnerId: string) {
    const partner = await this.prisma.partner.findFirst({
      where: { id: partnerId, projectId },
    });
    if (!partner) throw new NotFoundException(this.i18n.t('investment.partner_not_found'));
    return partner;
  }

  async addInvestment(
    projectId: string,
    seasonId: string,
    partnerId: string,
    dto: AddInvestmentDto,
    createdByUserId: string,
  ) {
    await this.seasonsService.assertActive(seasonId);
    await this.findPartnerOrThrow(projectId, partnerId);

    const investment = await this.prisma.partnerInvestment.create({
      data: {
        partnerId,
        seasonId,
        amount: dto.amount,
        investmentDate: new Date(dto.investmentDate),
        method: dto.method ?? InvestmentMethod.CASH,
        note: dto.note,
        createdByUserId,
      },
    });

    await this.activityLogService.log({
      projectId,
      seasonId,
      actionKey: 'investment_added',
      entityType: 'PartnerInvestment',
      entityId: investment.id,
      summary: { partnerId, amount: dto.amount },
      actorUserId: createdByUserId,
    });

    await this.notificationService.sendToProjectMembers(
      projectId,
      {
        title: 'বিনিয়োগ যোগ হয়েছে',
        body: `৳${dto.amount}`,
        data: { partnerInvestmentId: investment.id, projectId },
      },
      { excludeUserId: createdByUserId, actionKey: 'investment_added' },
    );

    return investment;
  }

  /** Mid-season withdrawal — tracked separately from year-end profit distribution, per spec §5.8. */
  async addWithdrawal(
    projectId: string,
    seasonId: string,
    partnerId: string,
    dto: AddWithdrawalDto,
    createdByUserId: string,
  ) {
    await this.seasonsService.assertActive(seasonId);
    await this.findPartnerOrThrow(projectId, partnerId);

    const withdrawal = await this.prisma.partnerWithdrawal.create({
      data: {
        partnerId,
        seasonId,
        amount: dto.amount,
        withdrawalDate: new Date(dto.withdrawalDate),
        note: dto.note,
        createdByUserId,
      },
    });

    await this.activityLogService.log({
      projectId,
      seasonId,
      actionKey: 'withdrawal_added',
      entityType: 'PartnerWithdrawal',
      entityId: withdrawal.id,
      summary: { partnerId, amount: dto.amount },
      actorUserId: createdByUserId,
    });

    await this.notificationService.sendToProjectMembers(
      projectId,
      {
        title: 'উত্তোলন করা হয়েছে',
        body: `৳${dto.amount}`,
        data: { partnerWithdrawalId: withdrawal.id, projectId },
      },
      { excludeUserId: createdByUserId, actionKey: 'withdrawal_added' },
    );

    return withdrawal;
  }

  async listInvestments(projectId: string, partnerId: string) {
    await this.findPartnerOrThrow(projectId, partnerId);
    return this.prisma.partnerInvestment.findMany({
      where: { partnerId },
      orderBy: { investmentDate: 'desc' },
    });
  }

  /** All partners' investments + withdrawals for a season — the Investment & Withdrawal Report (§5.12). */
  async listAllForSeason(projectId: string, seasonId: string) {
    const [investments, withdrawals] = await Promise.all([
      this.prisma.partnerInvestment.findMany({
        where: { seasonId, partner: { projectId } },
        include: { partner: { include: { user: { select: { name: true, mobileNumber: true } } } } },
        orderBy: { investmentDate: 'desc' },
      }),
      this.prisma.partnerWithdrawal.findMany({
        where: { seasonId, partner: { projectId } },
        include: { partner: { include: { user: { select: { name: true, mobileNumber: true } } } } },
        orderBy: { withdrawalDate: 'desc' },
      }),
    ]);
    return { investments, withdrawals };
  }

  async listWithdrawals(projectId: string, partnerId: string) {
    await this.findPartnerOrThrow(projectId, partnerId);
    return this.prisma.partnerWithdrawal.findMany({
      where: { partnerId },
      orderBy: { withdrawalDate: 'desc' },
    });
  }

  /**
   * Running balance = investments (in) − withdrawals (out). Final share
   * settlement (profit share − withdrawals) is added on top of this at
   * season close, by the Season Closing module (#16) — this is the
   * pre-settlement ledger view described in spec §5.8.
   */
  async getLedgerSummary(projectId: string, partnerId: string) {
    await this.findPartnerOrThrow(projectId, partnerId);

    const [investmentAgg, withdrawalAgg] = await Promise.all([
      this.prisma.partnerInvestment.aggregate({
        where: { partnerId },
        _sum: { amount: true },
      }),
      this.prisma.partnerWithdrawal.aggregate({
        where: { partnerId },
        _sum: { amount: true },
      }),
    ]);

    const totalInvested = investmentAgg._sum.amount ?? new Prisma.Decimal(0);
    const totalWithdrawn = withdrawalAgg._sum.amount ?? new Prisma.Decimal(0);

    return {
      partnerId,
      totalInvested,
      totalWithdrawn,
      runningBalance: totalInvested.sub(totalWithdrawn),
    };
  }
}
