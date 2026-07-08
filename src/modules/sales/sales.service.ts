import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Prisma, Sale } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SeasonsService } from '../season/season.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seasonsService: SeasonsService,
    private readonly activityLogService: ActivityLogService,
    private readonly i18n: I18nService,
  ) {}

  async create(
    projectId: string,
    seasonId: string,
    dto: CreateSaleDto,
    createdByUserId: string,
  ): Promise<Sale> {
    await this.seasonsService.assertActive(seasonId);

    const relatedCost = dto.relatedCost ?? 0;
    const netAmount = new Prisma.Decimal(dto.grossAmount).sub(relatedCost);

    const sale = await this.prisma.sale.create({
      data: {
        projectId,
        seasonId,
        fishSpeciesId: dto.fishSpeciesId,
        quantityKg: dto.quantityKg,
        grossAmount: dto.grossAmount,
        relatedCost,
        netAmount,
        saleDate: new Date(dto.saleDate),
        note: dto.note,
        createdByUserId,
      },
    });

    await this.activityLogService.log({
      projectId,
      seasonId,
      actionKey: 'sale_added',
      entityType: 'Sale',
      entityId: sale.id,
      summary: { quantityKg: dto.quantityKg, netAmount: netAmount.toString() },
      actorUserId: createdByUserId,
    });

    return sale;
  }

  async findAllForSeason(projectId: string, seasonId: string): Promise<Sale[]> {
    return this.prisma.sale.findMany({
      where: { projectId, seasonId },
      include: { fishSpecies: true },
      orderBy: { saleDate: 'desc' },
    });
  }

  async findById(projectId: string, seasonId: string, saleId: string): Promise<Sale> {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, projectId, seasonId },
      include: { fishSpecies: true },
    });
    if (!sale) throw new NotFoundException(this.i18n.t('sales.not_found'));
    return sale;
  }

  async update(
    projectId: string,
    seasonId: string,
    saleId: string,
    dto: UpdateSaleDto,
  ): Promise<Sale> {
    await this.seasonsService.assertActive(seasonId);
    const existing = await this.findById(projectId, seasonId, saleId);

    const grossAmount = dto.grossAmount ?? existing.grossAmount.toNumber();
    const relatedCost = dto.relatedCost ?? existing.relatedCost.toNumber();
    const netAmount = new Prisma.Decimal(grossAmount).sub(relatedCost);

    return this.prisma.sale.update({
      where: { id: saleId },
      data: {
        quantityKg: dto.quantityKg,
        grossAmount,
        relatedCost,
        netAmount,
        saleDate: dto.saleDate ? new Date(dto.saleDate) : undefined,
        note: dto.note,
      },
    });
  }

  /** Total net sales for the season — the figure §5.13's profit/loss formula subtracts total expenses from. */
  async totalNetSales(projectId: string, seasonId: string): Promise<Prisma.Decimal> {
    const result = await this.prisma.sale.aggregate({
      where: { projectId, seasonId },
      _sum: { netAmount: true },
    });
    return result._sum.netAmount ?? new Prisma.Decimal(0);
  }
}
