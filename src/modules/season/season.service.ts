import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Season, SeasonStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';

@Injectable()
export class SeasonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async create(projectId: string, dto: CreateSeasonDto): Promise<Season> {
    const [activeSeason, yearClash] = await Promise.all([
      this.prisma.season.findFirst({
        where: { projectId, status: SeasonStatus.ACTIVE },
      }),
      this.prisma.season.findUnique({
        where: { projectId_year: { projectId, year: dto.year } },
      }),
    ]);

    if (activeSeason) {
      throw new ConflictException(this.i18n.t('season.active_season_exists'));
    }
    if (yearClash) {
      throw new ConflictException(this.i18n.t('season.year_already_exists'));
    }

    return this.prisma.season.create({
      data: { projectId, year: dto.year, label: dto.label },
    });
  }

  async findAllForProject(projectId: string): Promise<Season[]> {
    return this.prisma.season.findMany({
      where: { projectId },
      orderBy: { year: 'desc' },
    });
  }

  /** Convenience lookup used by the dashboard and by every future module that
   * defaults to "the current season" when none is explicitly specified. */
  async findActiveForProject(projectId: string): Promise<Season> {
    const season = await this.prisma.season.findFirst({
      where: { projectId, status: SeasonStatus.ACTIVE },
    });
    if (!season) {
      throw new NotFoundException(this.i18n.t('season.no_active_season'));
    }
    return season;
  }

  async findById(projectId: string, seasonId: string): Promise<Season> {
    const season = await this.prisma.season.findFirst({
      where: { id: seasonId, projectId },
    });
    if (!season) {
      throw new NotFoundException(this.i18n.t('season.not_found'));
    }
    return season;
  }

  async update(projectId: string, seasonId: string, dto: UpdateSeasonDto): Promise<Season> {
    const season = await this.findById(projectId, seasonId);
    if (season.status === SeasonStatus.CLOSED) {
      throw new ConflictException(this.i18n.t('season.season_closed_readonly'));
    }
    return this.prisma.season.update({
      where: { id: seasonId },
      data: { label: dto.label },
    });
  }

  /**
   * Mechanical close only: flips status + records who/when. Does NOT compute
   * profit/loss or partner distribution — that calculation is layered on top
   * of this same action by the Season Closing module (#16) once
   * Sales/Expense/Investment data exists to compute it from. Every future
   * module that writes season-scoped data must call `assertActive()` before
   * allowing a write, so this flip is what makes a season read-only
   * platform-wide, immediately.
   */
  async close(projectId: string, seasonId: string, closedByUserId: string): Promise<Season> {
    const season = await this.findById(projectId, seasonId);
    if (season.status === SeasonStatus.CLOSED) {
      throw new ConflictException(this.i18n.t('season.season_already_closed'));
    }
    return this.prisma.season.update({
      where: { id: seasonId },
      data: { status: SeasonStatus.CLOSED, closedAt: new Date(), closedByUserId },
    });
  }

  /**
   * Reusable guard for every future module (Fish, Feed, Expense, Sales,
   * WaterQuality, ...): call this before any write that's scoped to a
   * season, and use the returned row's `projectId` if you need it. Throws
   * if the season doesn't exist or is closed.
   */
  async assertActive(seasonId: string): Promise<Season> {
    const season = await this.prisma.season.findUnique({ where: { id: seasonId } });
    if (!season) {
      throw new NotFoundException(this.i18n.t('season.not_found'));
    }
    if (season.status === SeasonStatus.CLOSED) {
      throw new ConflictException(this.i18n.t('season.season_closed_readonly'));
    }
    return season;
  }
}
