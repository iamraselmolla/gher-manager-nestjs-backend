import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Expense, ExpenseCategory, ExpenseSourceType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SeasonsService } from '../season/season.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationService } from '../notification/notification.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

export type TimelineGranularity = 'day' | 'month' | 'year';

@Injectable()
export class ExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seasonsService: SeasonsService,
    private readonly activityLogService: ActivityLogService,
    private readonly notificationService: NotificationService,
    private readonly i18n: I18nService,
  ) {}

  /** Manual entry — typically LABOR/TRANSPORT/MACHINERY/OTHER. */
  async create(
    projectId: string,
    seasonId: string,
    dto: CreateExpenseDto,
    createdByUserId: string,
  ): Promise<Expense> {
    await this.seasonsService.assertActive(seasonId);
    const expense = await this.prisma.expense.create({
      data: {
        projectId,
        seasonId,
        category: dto.category,
        amount: dto.amount,
        expenseDate: new Date(dto.expenseDate),
        note: dto.note,
        sourceType: ExpenseSourceType.MANUAL,
        createdByUserId,
      },
    });

    await this.activityLogService.log({
      projectId,
      seasonId,
      actionKey: 'expense_added',
      entityType: 'Expense',
      entityId: expense.id,
      summary: { category: dto.category, amount: dto.amount },
      actorUserId: createdByUserId,
    });

    // Only manual entries notify here — auto-generated expenses (Feed/
    // Medicine/Fish stocking) already send their own, more specific
    // notification from their source module; notifying twice for the same
    // underlying action would be noise, not signal.
    await this.notificationService.sendToProjectMembers(
      projectId,
      {
        title: 'খরচ যোগ হয়েছে',
        body: `${dto.category} — ৳${dto.amount}`,
        data: { expenseId: expense.id, projectId },
      },
      { excludeUserId: createdByUserId, actionKey: 'expense_added' },
    );

    return expense;
  }

  /**
   * Called by FishBatchService, FeedPurchaseService, and MedicineStockService
   * at write time — creates the Expense the first time a source record is
   * saved, and updates the SAME row in place on subsequent edits (matched
   * via the `[sourceType, sourceId]` unique constraint), so a batch/purchase
   * being corrected never produces a duplicate or orphaned expense.
   */
  async upsertFromSource(input: {
    projectId: string;
    seasonId: string;
    category: ExpenseCategory;
    amount: number;
    expenseDate: Date;
    note?: string;
    sourceType: ExpenseSourceType;
    sourceId: string;
    createdByUserId: string;
  }): Promise<Expense> {
    return this.prisma.expense.upsert({
      where: {
        sourceType_sourceId: { sourceType: input.sourceType, sourceId: input.sourceId },
      },
      create: {
        projectId: input.projectId,
        seasonId: input.seasonId,
        category: input.category,
        amount: input.amount,
        expenseDate: input.expenseDate,
        note: input.note,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        createdByUserId: input.createdByUserId,
      },
      update: {
        amount: input.amount,
        expenseDate: input.expenseDate,
        note: input.note,
      },
    });
  }

  async findAllForSeason(
    projectId: string,
    seasonId: string,
    category?: ExpenseCategory,
  ): Promise<Expense[]> {
    return this.prisma.expense.findMany({
      where: { projectId, seasonId, category },
      orderBy: { expenseDate: 'desc' },
    });
  }

  async findById(projectId: string, seasonId: string, expenseId: string): Promise<Expense> {
    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, projectId, seasonId },
    });
    if (!expense) throw new NotFoundException(this.i18n.t('expense.not_found'));
    return expense;
  }

  async update(
    projectId: string,
    seasonId: string,
    expenseId: string,
    dto: UpdateExpenseDto,
  ): Promise<Expense> {
    await this.seasonsService.assertActive(seasonId);
    const existing = await this.findById(projectId, seasonId, expenseId);
    if (existing.sourceType !== ExpenseSourceType.MANUAL) {
      throw new BadRequestException(this.i18n.t('expense.cannot_edit_auto_generated'));
    }
    return this.prisma.expense.update({
      where: { id: expenseId },
      data: {
        amount: dto.amount,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
        note: dto.note,
      },
    });
  }

  /** Category-wise breakdown — one of the two required Expense views (§5.6). */
  async categoryBreakdown(projectId: string, seasonId: string) {
    const rows = await this.prisma.expense.groupBy({
      by: ['category'],
      where: { projectId, seasonId },
      _sum: { amount: true },
    });
    return rows.map((r) => ({
      category: r.category,
      total: r._sum.amount ?? new Prisma.Decimal(0),
    }));
  }

  /**
   * Timeline-wise breakdown — the other required Expense view (§5.6).
   * Bucketed in application code (day/month/year) rather than a raw SQL
   * date_trunc query, since a single farm's per-season expense volume is
   * small enough that this stays simple and portable across DB providers.
   */
  async timelineBreakdown(projectId: string, seasonId: string, granularity: TimelineGranularity) {
    const expenses = await this.prisma.expense.findMany({
      where: { projectId, seasonId },
      select: { expenseDate: true, amount: true },
    });

    const bucketOf = (date: Date): string => {
      const y = date.getUTCFullYear();
      const m = `${date.getUTCMonth() + 1}`.padStart(2, '0');
      const d = `${date.getUTCDate()}`.padStart(2, '0');
      if (granularity === 'year') return `${y}`;
      if (granularity === 'month') return `${y}-${m}`;
      return `${y}-${m}-${d}`;
    };

    const totals = new Map<string, Prisma.Decimal>();
    for (const e of expenses) {
      const key = bucketOf(e.expenseDate);
      totals.set(key, (totals.get(key) ?? new Prisma.Decimal(0)).add(e.amount));
    }

    return Array.from(totals.entries())
      .map(([bucket, total]) => ({ bucket, total }))
      .sort((a, b) => a.bucket.localeCompare(b.bucket));
  }
}
