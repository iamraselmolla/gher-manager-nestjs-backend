import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ProjectRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async list(projectId: string) {
    return this.prisma.projectMember.findMany({
      where: { projectId, isActive: true },
      include: { user: { select: { id: true, name: true, mobileNumber: true } } },
      orderBy: { addedAt: 'asc' },
    });
  }

  async add(projectId: string, mobileNumber: string, role: ProjectRole) {
    const user = await this.prisma.user.findUnique({ where: { mobileNumber } });
    if (!user) {
      throw new NotFoundException(this.i18n.t('common.errors.not_found'));
    }

    const existing = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });

    if (existing) {
      if (existing.isActive) {
        throw new ConflictException(this.i18n.t('project.member_already_exists'));
      }
      // Re-activating a previously removed member preserves their original
      // `addedAt` history rather than creating a duplicate row.
      return this.prisma.projectMember.update({
        where: { id: existing.id },
        data: { role, isActive: true, removedAt: null },
      });
    }

    return this.prisma.projectMember.create({
      data: { projectId, userId: user.id, role },
    });
  }

  async updateRole(projectId: string, memberId: string, role: ProjectRole) {
    const member = await this.prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
    });
    if (!member) {
      throw new NotFoundException(this.i18n.t('project.member_not_found'));
    }
    return this.prisma.projectMember.update({
      where: { id: memberId },
      data: { role },
    });
  }

  /** Soft-delete: revokes access but preserves history (audit + historical share accuracy). */
  async remove(projectId: string, memberId: string) {
    const member = await this.prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
    });
    if (!member) {
      throw new NotFoundException(this.i18n.t('project.member_not_found'));
    }
    return this.prisma.projectMember.update({
      where: { id: memberId },
      data: { isActive: false, removedAt: new Date() },
    });
  }
}
