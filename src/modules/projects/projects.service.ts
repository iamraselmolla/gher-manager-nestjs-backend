import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PlatformRole, Prisma, Project, ProjectStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';
import { PaginatedResult } from '../users/users.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async create(dto: CreateProjectDto, createdByUserId: string) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        address: dto.address,
        gpsLat: dto.gpsLat,
        gpsLng: dto.gpsLng,
        boundaryPolygon: dto.boundaryPolygon as unknown as Prisma.InputJsonValue,
        landArea: dto.landArea,
        landAreaUnit: dto.landAreaUnit,
        leaseAmount: dto.leaseAmount,
        leaseDurationYears: dto.leaseDurationYears,
        leaseStartDate: dto.leaseStartDate ? new Date(dto.leaseStartDate) : undefined,
        leaseEndDate: dto.leaseEndDate ? new Date(dto.leaseEndDate) : undefined,
        leaseAdvancePaid: dto.leaseAdvancePaid,
        landOwnerName: dto.landOwnerName,
        landOwnerAddress: dto.landOwnerAddress,
        createdByUserId,
      },
    });
  }

  /**
   * SUPER_ADMIN sees every project (platform-wide oversight); everyone else
   * sees only projects they have an active membership on (as Editor or
   * Investor) — this is the multi-project "portfolio view" filter the web
   * app's dashboard will rely on later.
   */
  async findAll(
    user: RequestUser,
    params: { page?: number; pageSize?: number; search?: string },
  ): Promise<PaginatedResult<Project>> {
    const page = Math.max(params.page ?? 1, 1);
    const pageSize = Math.min(Math.max(params.pageSize ?? 20, 1), 100);

    const visibilityFilter: Prisma.ProjectWhereInput =
      user.platformRole === PlatformRole.SUPER_ADMIN
        ? {}
        : {
            members: {
              some: { userId: user.id, isActive: true },
            },
          };

    const searchFilter: Prisma.ProjectWhereInput = params.search
      ? { name: { contains: params.search, mode: 'insensitive' } }
      : {};

    const where: Prisma.ProjectWhereInput = { AND: [visibilityFilter, searchFilter] };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: rows,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
      },
    };
  }

  /**
   * Fetches a single project. Access itself is already enforced by
   * `ProjectRolesGuard` at the route level before this ever runs — this
   * just 404s if the id doesn't exist.
   */
  async findById(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(this.i18n.t('project.not_found'));
    }
    return project;
  }

  async update(projectId: string, dto: UpdateProjectDto) {
    await this.findById(projectId);
    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...dto,
        boundaryPolygon: dto.boundaryPolygon
          ? (dto.boundaryPolygon as unknown as Prisma.InputJsonValue)
          : undefined,
        leaseStartDate: dto.leaseStartDate ? new Date(dto.leaseStartDate) : undefined,
        leaseEndDate: dto.leaseEndDate ? new Date(dto.leaseEndDate) : undefined,
      },
    });
  }

  async updateStatus(projectId: string, status: ProjectStatus) {
    await this.findById(projectId);
    return this.prisma.project.update({
      where: { id: projectId },
      data: { status },
    });
  }
}
