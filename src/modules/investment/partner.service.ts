import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { InvestmentMethod, Prisma, ProjectRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SeasonsService } from '../season/season.service';
import { UsersService } from '../users/users.service';
import { ProjectMembersService } from '../projects/project-members.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { AddPartnerDto } from './dto/add-partner.dto';
import { UpdatePartnerShareDto } from './dto/update-partner-share.dto';

@Injectable()
export class PartnerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seasonsService: SeasonsService,
    private readonly usersService: UsersService,
    private readonly projectMembersService: ProjectMembersService,
    private readonly activityLogService: ActivityLogService,
    private readonly i18n: I18nService,
  ) {}

  /** Every partner add/update/remove requires the project to have a currently active season, per spec §5.8. */
  private async assertProjectHasActiveSeason(projectId: string) {
    try {
      return await this.seasonsService.findActiveForProject(projectId);
    } catch {
      throw new ConflictException(
        this.i18n.t('investment.no_active_season_for_partner_changes'),
      );
    }
  }

  private async totalActiveShare(projectId: string, excludePartnerId?: string) {
    const rows = await this.prisma.partner.findMany({
      where: {
        projectId,
        isActive: true,
        ...(excludePartnerId ? { id: { not: excludePartnerId } } : {}),
      },
      select: { sharePercentage: true },
    });
    return rows.reduce((sum, r) => sum.add(r.sharePercentage), new Prisma.Decimal(0));
  }

  /**
   * Adding a partner: reuses an existing user by mobile number if one
   * exists, otherwise auto-creates the account (default password, forced
   * change on first login) via UsersService.createUser — the exact same
   * path Admin uses for Editors. Then links them via ProjectMembersService
   * as an INVESTOR, creates the Partner equity record, and logs the initial
   * investment as ledger entry #1.
   */
  async addPartner(projectId: string, dto: AddPartnerDto, createdByUserId: string) {
    const season = await this.assertProjectHasActiveSeason(projectId);

    const currentTotal = await this.totalActiveShare(projectId);
    const newTotal = currentTotal.add(dto.sharePercentage);
    if (newTotal.greaterThan(100)) {
      const max = new Prisma.Decimal(100).sub(currentTotal);
      throw new ConflictException(
        this.i18n.t('investment.share_exceeds_100', { args: { max: max.toString() } }),
      );
    }

    let user = await this.prisma.user.findUnique({ where: { mobileNumber: dto.mobileNumber } });
    let generatedPassword: string | null = null;

    if (!user) {
      const created = await this.usersService.createUser({
        name: dto.name,
        mobileNumber: dto.mobileNumber,
      });
      generatedPassword = created.generatedPassword;
      user = await this.prisma.user.findUniqueOrThrow({ where: { id: created.user.id } });
    } else {
      const existingPartner = await this.prisma.partner.findUnique({
        where: { projectId_userId: { projectId, userId: user.id } },
      });
      if (existingPartner?.isActive) {
        throw new ConflictException(this.i18n.t('investment.partner_already_exists'));
      }
    }

    // Ensures RBAC/visibility membership exists (reactivates it if this
    // person was a removed member before) — same path Editors use.
    await this.projectMembersService.add(projectId, dto.mobileNumber, ProjectRole.INVESTOR);

    const partner = await this.prisma.partner.upsert({
      where: { projectId_userId: { projectId, userId: user.id } },
      create: { projectId, userId: user.id, sharePercentage: dto.sharePercentage },
      update: { sharePercentage: dto.sharePercentage, isActive: true, removedAt: null },
    });

    const initialInvestment = await this.prisma.partnerInvestment.create({
      data: {
        partnerId: partner.id,
        seasonId: season.id,
        amount: dto.initialInvestment,
        investmentDate: dto.investmentDate ? new Date(dto.investmentDate) : new Date(),
        method: dto.method ?? InvestmentMethod.CASH,
        note: 'Initial investment (at partner creation)',
        createdByUserId,
      },
    });

    await this.activityLogService.log({
      projectId,
      seasonId: season.id,
      actionKey: 'partner_added',
      entityType: 'Partner',
      entityId: partner.id,
      summary: { name: dto.name, sharePercentage: dto.sharePercentage },
      actorUserId: createdByUserId,
    });

    return { partner, initialInvestment, generatedPassword };
  }

  async findAll(projectId: string) {
    return this.prisma.partner.findMany({
      where: { projectId, isActive: true },
      include: { user: { select: { id: true, name: true, mobileNumber: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async findByIdOrThrow(projectId: string, partnerId: string) {
    const partner = await this.prisma.partner.findFirst({
      where: { id: partnerId, projectId },
      include: { user: { select: { id: true, name: true, mobileNumber: true } } },
    });
    if (!partner) throw new NotFoundException(this.i18n.t('investment.partner_not_found'));
    return partner;
  }

  async findById(projectId: string, partnerId: string) {
    return this.findByIdOrThrow(projectId, partnerId);
  }

  /** ≥99% / ≤100% validation surfaced as an info summary rather than blocking incremental onboarding — see PROJECT_STATE.md. */
  async shareSummary(projectId: string) {
    const total = await this.totalActiveShare(projectId);
    return {
      totalActiveSharePercentage: total,
      meetsMinimumThreshold: total.greaterThanOrEqualTo(99),
      remainingPercentage: new Prisma.Decimal(100).sub(total),
    };
  }

  async updateShare(projectId: string, partnerId: string, dto: UpdatePartnerShareDto) {
    await this.assertProjectHasActiveSeason(projectId);
    await this.findByIdOrThrow(projectId, partnerId);

    const currentTotal = await this.totalActiveShare(projectId, partnerId);
    const newTotal = currentTotal.add(dto.sharePercentage);
    if (newTotal.greaterThan(100)) {
      const max = new Prisma.Decimal(100).sub(currentTotal);
      throw new ConflictException(
        this.i18n.t('investment.share_exceeds_100', { args: { max: max.toString() } }),
      );
    }

    return this.prisma.partner.update({
      where: { id: partnerId },
      data: { sharePercentage: dto.sharePercentage },
    });
  }

  /** Soft-delete: revokes project access but preserves the full ledger for historical profit-share accuracy. */
  async remove(projectId: string, partnerId: string) {
    await this.assertProjectHasActiveSeason(projectId);
    const partner = await this.findByIdOrThrow(projectId, partnerId);

    const [updatedPartner] = await this.prisma.$transaction([
      this.prisma.partner.update({
        where: { id: partnerId },
        data: { isActive: false, removedAt: new Date() },
      }),
      this.prisma.projectMember.updateMany({
        where: { projectId, userId: partner.userId },
        data: { isActive: false, removedAt: new Date() },
      }),
    ]);

    return updatedPartner;
  }
}
