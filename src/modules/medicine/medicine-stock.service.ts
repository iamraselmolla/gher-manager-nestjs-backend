import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ExpenseCategory, ExpenseSourceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SeasonsService } from '../season/season.service';
import { MedicineService } from './medicine.service';
import { ExpenseService } from '../expense/expense.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationService } from '../notification/notification.service';
import { CreateMedicineStockDto } from './dto/create-medicine-stock.dto';

@Injectable()
export class MedicineStockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seasonsService: SeasonsService,
    private readonly medicineService: MedicineService,
    private readonly expenseService: ExpenseService,
    private readonly activityLogService: ActivityLogService,
    private readonly notificationService: NotificationService,
    private readonly i18n: I18nService,
  ) {}

  async create(
    projectId: string,
    seasonId: string,
    dto: CreateMedicineStockDto,
    createdByUserId: string,
  ) {
    await this.seasonsService.assertActive(seasonId);

    const medicineId = dto.medicineId
      ? dto.medicineId
      : (
          await this.medicineService.findOrCreateCustom(
            dto.customMedicineName!,
            dto.customMedicineCategory!,
            createdByUserId,
          )
        ).id;

    const stock = await this.prisma.medicineStock.create({
      data: {
        projectId,
        seasonId,
        medicineId,
        quantity: dto.quantity,
        unit: dto.unit,
        cost: dto.cost,
        purchaseDate: new Date(dto.purchaseDate),
        note: dto.note,
        createdByUserId,
      },
    });

    // Medicine is cash-only (no vendor credit) — the full cost is an
    // expense immediately, unlike Feed's paid-portion-only rule.
    await this.expenseService.upsertFromSource({
      projectId,
      seasonId,
      category: ExpenseCategory.MEDICINE,
      amount: dto.cost,
      expenseDate: stock.purchaseDate,
      note: dto.note,
      sourceType: ExpenseSourceType.MEDICINE_STOCK,
      sourceId: stock.id,
      createdByUserId,
    });

    await this.activityLogService.log({
      projectId,
      seasonId,
      actionKey: 'medicine_stock_added',
      entityType: 'MedicineStock',
      entityId: stock.id,
      summary: { quantity: dto.quantity, unit: dto.unit, cost: dto.cost },
      actorUserId: createdByUserId,
    });

    const medicine = await this.prisma.medicine.findUnique({ where: { id: medicineId } });
    await this.notificationService.sendToProjectMembers(
      projectId,
      {
        title: 'মেডিসিন যোগ হয়েছে',
        body: `${medicine?.nameBn ?? ''} — ${dto.quantity} ${dto.unit}`,
        data: { medicineStockId: stock.id, projectId },
      },
      { excludeUserId: createdByUserId, actionKey: 'medicine_stock_added' },
    );

    return stock;
  }

  async findAllForSeason(projectId: string, seasonId: string) {
    return this.prisma.medicineStock.findMany({
      where: { projectId, seasonId },
      include: { medicine: true },
      orderBy: { purchaseDate: 'desc' },
    });
  }

  async findById(projectId: string, seasonId: string, stockId: string) {
    const stock = await this.prisma.medicineStock.findFirst({
      where: { id: stockId, projectId, seasonId },
      include: { medicine: true },
    });
    if (!stock) throw new NotFoundException(this.i18n.t('medicine.stock_not_found'));
    return stock;
  }

  /**
   * Remaining = purchased − used-in-treatments, grouped by medicineId. Feed
   * has a separate usage log (FeedUsage); medicine doesn't — Treatment rows
   * ARE the usage log, so this diffs against those directly. Used by the
   * Dashboard (§6) for "মেডিসিন স্টক লেভেল".
   */
  async getStockSummary(projectId: string, seasonId: string) {
    const [stocks, treatments] = await Promise.all([
      this.prisma.medicineStock.groupBy({
        by: ['medicineId'],
        where: { projectId, seasonId },
        _sum: { quantity: true },
      }),
      this.prisma.treatment.groupBy({
        by: ['medicineId'],
        where: { projectId, seasonId },
        _sum: { quantityUsed: true },
      }),
    ]);

    const medicineIds = new Set([
      ...stocks.map((s) => s.medicineId),
      ...treatments.map((t) => t.medicineId),
    ]);
    const medicines = await this.prisma.medicine.findMany({
      where: { id: { in: Array.from(medicineIds) } },
    });

    return Array.from(medicineIds).map((medicineId) => {
      const purchased = stocks.find((s) => s.medicineId === medicineId)?._sum.quantity ?? 0;
      const used = treatments.find((t) => t.medicineId === medicineId)?._sum.quantityUsed ?? 0;
      const medicine = medicines.find((m) => m.id === medicineId);
      return {
        medicineId,
        medicineName: medicine?.nameBn ?? '',
        totalPurchased: purchased,
        totalUsed: used,
        remaining: purchased - used,
      };
    });
  }
}
