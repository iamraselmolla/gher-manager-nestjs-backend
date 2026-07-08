import { BadRequestException, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ExpenseService } from '../expense/expense.service';
import { FishBatchService } from '../fish/fish-batch.service';
import { GrowthService } from '../growth/growth.service';
import { TreatmentService } from '../medicine/treatment.service';
import { SalesService } from '../sales/sales.service';
import { PartnerLedgerService } from '../investment/partner-ledger.service';
import { renderPdfTable, PdfTableColumn } from './pdf-table.util';

export type ReportType =
  | 'expense'
  | 'fish-stock'
  | 'growth'
  | 'treatment'
  | 'sales'
  | 'investment';

interface ReportPayload {
  title: string;
  columns: PdfTableColumn[];
  rows: Record<string, string>[];
  raw: unknown;
}

@Injectable()
export class ReportService {
  constructor(
    private readonly expenseService: ExpenseService,
    private readonly fishBatchService: FishBatchService,
    private readonly growthService: GrowthService,
    private readonly treatmentService: TreatmentService,
    private readonly salesService: SalesService,
    private readonly partnerLedgerService: PartnerLedgerService,
    private readonly i18n: I18nService,
  ) {}

  private money(v: { toString(): string } | number): string {
    return typeof v === 'number' ? v.toFixed(2) : v.toString();
  }

  private date(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  /** Builds the (title, columns, rows) shape shared by the JSON view and the PDF export, for one report type. */
  async buildReport(
    type: ReportType,
    projectId: string,
    seasonId: string,
  ): Promise<ReportPayload> {
    switch (type) {
      case 'expense': {
        const expenses = await this.expenseService.findAllForSeason(projectId, seasonId);
        return {
          title: this.i18n.t('report.expense_report_title'),
          columns: [
            { header: 'Date', key: 'date', width: 70 },
            { header: 'Category', key: 'category', width: 100 },
            { header: 'Amount', key: 'amount', width: 80 },
            { header: 'Note', key: 'note', width: 200 },
          ],
          rows: expenses.map((e) => ({
            date: this.date(e.expenseDate),
            category: e.category,
            amount: this.money(e.amount),
            note: e.note ?? '',
          })),
          raw: expenses,
        };
      }
      case 'fish-stock': {
        const batches = await this.fishBatchService.findAllForSeason(projectId, seasonId);
        return {
          title: this.i18n.t('report.fish_stock_report_title'),
          columns: [
            { header: 'Stocked', key: 'stockedDate', width: 70 },
            { header: 'Quantity', key: 'quantity', width: 70 },
            { header: 'Unit', key: 'unit', width: 50 },
            { header: 'Age (days)', key: 'age', width: 70 },
            { header: 'Cost', key: 'cost', width: 80 },
          ],
          rows: batches.map((b) => ({
            stockedDate: this.date(b.stockedDate),
            quantity: this.money(b.quantity),
            unit: b.unit,
            age: String(b.ageInDays),
            cost: this.money(b.cost),
          })),
          raw: batches,
        };
      }
      case 'growth': {
        const checks = await this.growthService.findAllForSeason(projectId, seasonId);
        return {
          title: this.i18n.t('report.growth_report_title'),
          columns: [
            { header: 'Date', key: 'date', width: 70 },
            { header: 'Current (g)', key: 'current', width: 80 },
            { header: 'Growth (g)', key: 'growth', width: 80 },
            { header: 'Days since last', key: 'days', width: 90 },
          ],
          rows: checks.map((c) => ({
            date: this.date(c.checkDate),
            current: this.money(c.currentWeight),
            growth: c.growthAmount !== null ? this.money(c.growthAmount) : '-',
            days: c.daysSinceLastCheck !== null ? String(c.daysSinceLastCheck) : '-',
          })),
          raw: checks,
        };
      }
      case 'treatment': {
        const treatments = await this.treatmentService.findAllForSeason(projectId, seasonId);
        return {
          title: this.i18n.t('report.treatment_report_title'),
          columns: [
            { header: 'Date', key: 'date', width: 70 },
            { header: 'Quantity', key: 'quantity', width: 60 },
            { header: 'Reason', key: 'reason', width: 160 },
            { header: 'Next follow-up', key: 'followUp', width: 90 },
          ],
          rows: treatments.map((t) => ({
            date: this.date(t.treatmentDate),
            quantity: `${this.money(t.quantityUsed)} ${t.unit}`,
            reason: t.reason ?? '',
            followUp: t.nextFollowUpDate ? this.date(t.nextFollowUpDate) : '-',
          })),
          raw: treatments,
        };
      }
      case 'sales': {
        const sales = await this.salesService.findAllForSeason(projectId, seasonId);
        return {
          title: this.i18n.t('report.sales_report_title'),
          columns: [
            { header: 'Date', key: 'date', width: 70 },
            { header: 'Qty (kg)', key: 'qty', width: 60 },
            { header: 'Gross', key: 'gross', width: 80 },
            { header: 'Related cost', key: 'cost', width: 80 },
            { header: 'Net', key: 'net', width: 80 },
          ],
          rows: sales.map((s) => ({
            date: this.date(s.saleDate),
            qty: this.money(s.quantityKg),
            gross: this.money(s.grossAmount),
            cost: this.money(s.relatedCost),
            net: this.money(s.netAmount),
          })),
          raw: sales,
        };
      }
      case 'investment': {
        const { investments, withdrawals } = await this.partnerLedgerService.listAllForSeason(
          projectId,
          seasonId,
        );
        const rows: Record<string, string>[] = [
          ...investments.map((inv) => ({
            date: this.date(inv.investmentDate),
            type: 'Investment',
            partner: inv.partner.user.name,
            amount: this.money(inv.amount),
          })),
          ...withdrawals.map((w) => ({
            date: this.date(w.withdrawalDate),
            type: 'Withdrawal',
            partner: w.partner.user.name,
            amount: this.money(w.amount),
          })),
        ].sort((a, b) => a.date.localeCompare(b.date));
        return {
          title: this.i18n.t('report.investment_report_title'),
          columns: [
            { header: 'Date', key: 'date', width: 70 },
            { header: 'Type', key: 'type', width: 90 },
            { header: 'Partner', key: 'partner', width: 150 },
            { header: 'Amount', key: 'amount', width: 80 },
          ],
          rows,
          raw: { investments, withdrawals },
        };
      }
      default:
        throw new BadRequestException(this.i18n.t('report.invalid_report_type'));
    }
  }

  async getReportJson(type: ReportType, projectId: string, seasonId: string) {
    const { title, raw } = await this.buildReport(type, projectId, seasonId);
    return { title, data: raw };
  }

  async getReportPdf(type: ReportType, projectId: string, seasonId: string): Promise<Buffer> {
    const { title, columns, rows } = await this.buildReport(type, projectId, seasonId);
    const subtitle = `Project: ${projectId}  ·  Season: ${seasonId}  ·  Generated: ${new Date().toISOString().slice(0, 10)}`;
    return renderPdfTable(title, subtitle, columns, rows);
  }
}
