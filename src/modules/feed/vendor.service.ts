import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { AddVendorLedgerPaymentDto } from './dto/add-vendor-ledger-payment.dto';

@Injectable()
export class VendorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async create(projectId: string, dto: CreateVendorDto) {
    return this.prisma.vendor.create({ data: { projectId, ...dto } });
  }

  async findAll(projectId: string) {
    return this.prisma.vendor.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    });
  }

  private async findVendorOrThrow(projectId: string, vendorId: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, projectId },
    });
    if (!vendor) throw new NotFoundException(this.i18n.t('feed.vendor_not_found'));
    return vendor;
  }

  /**
   * Running balance across the vendor's entire history (not season-scoped —
   * see schema comment on `Vendor`): totalPurchased from every FeedPurchase
   * line, totalPaid combining amounts paid at purchase time AND standalone
   * ledger-clearance payments, balanceDue = totalPurchased − totalPaid
   * (negative means the farm has a credit/advance with this vendor).
   */
  async getLedgerSummary(projectId: string, vendorId: string) {
    await this.findVendorOrThrow(projectId, vendorId);

    const [purchaseAgg, paymentAgg] = await Promise.all([
      this.prisma.feedPurchase.aggregate({
        where: { vendorId },
        _sum: { totalPrice: true, paidAmount: true },
      }),
      this.prisma.vendorLedgerPayment.aggregate({
        where: { vendorId },
        _sum: { amount: true },
      }),
    ]);

    const totalPurchased = purchaseAgg._sum.totalPrice ?? new Prisma.Decimal(0);
    const paidAtPurchase = purchaseAgg._sum.paidAmount ?? new Prisma.Decimal(0);
    const paidViaLedger = paymentAgg._sum.amount ?? new Prisma.Decimal(0);
    const totalPaid = paidAtPurchase.add(paidViaLedger);
    const balanceDue = totalPurchased.sub(totalPaid);

    return {
      vendorId,
      totalPurchased,
      totalPaid,
      balanceDue,
    };
  }

  async addLedgerPayment(
    projectId: string,
    vendorId: string,
    dto: AddVendorLedgerPaymentDto,
    createdByUserId: string,
  ) {
    await this.findVendorOrThrow(projectId, vendorId);
    return this.prisma.vendorLedgerPayment.create({
      data: {
        vendorId,
        amount: dto.amount,
        paymentDate: new Date(dto.paymentDate),
        note: dto.note,
        createdByUserId,
      },
    });
  }

  async listLedgerPayments(projectId: string, vendorId: string) {
    await this.findVendorOrThrow(projectId, vendorId);
    return this.prisma.vendorLedgerPayment.findMany({
      where: { vendorId },
      orderBy: { paymentDate: 'desc' },
    });
  }
}
