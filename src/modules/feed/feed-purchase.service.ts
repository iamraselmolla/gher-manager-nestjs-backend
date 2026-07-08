import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ExpenseCategory, ExpenseSourceType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SeasonsService } from '../season/season.service';
import { ExpenseService } from '../expense/expense.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationService } from '../notification/notification.service';
import { CreateFeedPurchaseDto } from './dto/create-feed-purchase.dto';
import { UpdateFeedPurchaseDto } from './dto/update-feed-purchase.dto';

@Injectable()
export class FeedPurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seasonsService: SeasonsService,
    private readonly expenseService: ExpenseService,
    private readonly activityLogService: ActivityLogService,
    private readonly notificationService: NotificationService,
    private readonly i18n: I18nService,
  ) {}

  private computeAmounts(bags: number, pricePerBag: number, paidAmount: number) {
    const totalPrice = new Prisma.Decimal(bags).mul(pricePerBag);
    const dueAmount = totalPrice.sub(paidAmount);
    return { totalPrice, dueAmount };
  }

  async create(
    projectId: string,
    seasonId: string,
    dto: CreateFeedPurchaseDto,
    createdByUserId: string,
  ) {
    await this.seasonsService.assertActive(seasonId);
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: dto.vendorId, projectId },
    });
    if (!vendor) throw new NotFoundException(this.i18n.t('feed.vendor_not_found'));

    const { totalPrice, dueAmount } = this.computeAmounts(
      dto.bags,
      dto.pricePerBag,
      dto.paidAmount,
    );

    const purchase = await this.prisma.feedPurchase.create({
      data: {
        projectId,
        seasonId,
        vendorId: dto.vendorId,
        feedName: dto.feedName,
        bags: dto.bags,
        pricePerBag: dto.pricePerBag,
        totalPrice,
        paidAmount: dto.paidAmount,
        dueAmount,
        purchaseDate: new Date(dto.purchaseDate),
        note: dto.note,
        createdByUserId,
      },
    });

    // Only the amount actually PAID becomes an expense — the due portion
    // stays in the Vendor Ledger until settled, per spec §5.4.
    await this.expenseService.upsertFromSource({
      projectId,
      seasonId,
      category: ExpenseCategory.FEED,
      amount: dto.paidAmount,
      expenseDate: purchase.purchaseDate,
      note: `${dto.feedName} — ${dto.bags} bags`,
      sourceType: ExpenseSourceType.FEED_PURCHASE,
      sourceId: purchase.id,
      createdByUserId,
    });

    await this.activityLogService.log({
      projectId,
      seasonId,
      actionKey: 'feed_purchase_added',
      entityType: 'FeedPurchase',
      entityId: purchase.id,
      summary: { feedName: dto.feedName, bags: dto.bags, paidAmount: dto.paidAmount },
      actorUserId: createdByUserId,
    });

    await this.notificationService.sendToProjectMembers(
      projectId,
      {
        title: 'ফিড ক্রয় যোগ হয়েছে',
        body: `${dto.feedName} — ${dto.bags} বস্তা`,
        data: { feedPurchaseId: purchase.id, projectId },
      },
      { excludeUserId: createdByUserId, actionKey: 'feed_purchase_added' },
    );

    return purchase;
  }

  async findAllForSeason(projectId: string, seasonId: string) {
    return this.prisma.feedPurchase.findMany({
      where: { projectId, seasonId },
      include: { vendor: true },
      orderBy: { purchaseDate: 'desc' },
    });
  }

  private async findByIdOrThrow(projectId: string, seasonId: string, purchaseId: string) {
    const purchase = await this.prisma.feedPurchase.findFirst({
      where: { id: purchaseId, projectId, seasonId },
    });
    if (!purchase) throw new NotFoundException(this.i18n.t('feed.purchase_not_found'));
    return purchase;
  }

  async findById(projectId: string, seasonId: string, purchaseId: string) {
    return this.findByIdOrThrow(projectId, seasonId, purchaseId);
  }

  async update(
    projectId: string,
    seasonId: string,
    purchaseId: string,
    dto: UpdateFeedPurchaseDto,
  ) {
    await this.seasonsService.assertActive(seasonId);
    const existing = await this.findByIdOrThrow(projectId, seasonId, purchaseId);

    const bags = dto.bags ?? existing.bags;
    const pricePerBag = dto.pricePerBag ?? existing.pricePerBag.toNumber();
    const paidAmount = dto.paidAmount ?? existing.paidAmount.toNumber();
    const { totalPrice, dueAmount } = this.computeAmounts(bags, pricePerBag, paidAmount);

    const updated = await this.prisma.feedPurchase.update({
      where: { id: purchaseId },
      data: {
        bags,
        pricePerBag,
        totalPrice,
        paidAmount,
        dueAmount,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        note: dto.note,
      },
    });

    await this.expenseService.upsertFromSource({
      projectId,
      seasonId,
      category: ExpenseCategory.FEED,
      amount: paidAmount,
      expenseDate: updated.purchaseDate,
      note: `${updated.feedName} — ${bags} bags`,
      sourceType: ExpenseSourceType.FEED_PURCHASE,
      sourceId: updated.id,
      createdByUserId: updated.createdByUserId,
    });

    return updated;
  }
}
