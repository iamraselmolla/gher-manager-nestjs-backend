import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { I18nContext } from 'nestjs-i18n';
import { PlatformRole, ProjectRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PROJECT_ROLES_KEY } from '../decorators/project-roles.decorator';
import { AuthenticatedRequest } from '../../modules/auth/interfaces/authenticated-request.interface';

/**
 * Enforces `@ProjectRoles(...)` on routes shaped `.../:projectId/...`.
 *
 * Resolution order:
 *   1. No `@ProjectRoles()` metadata on the route → allow (guard is a no-op).
 *   2. `platformRole === SUPER_ADMIN` → always allow (full cross-project access).
 *   3. Otherwise, look up an active `ProjectMember` row for
 *      (projectId, userId) and check its role is one of the required roles.
 *
 * On success, attaches `request.projectMembership` so downstream handlers
 * can cheaply tell (e.g.) "this caller is an INVESTOR, so read-only" without
 * a second query.
 */
@Injectable()
export class ProjectRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<ProjectRole[]>(
      PROJECT_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const i18n = I18nContext.current(context);
    const t = (key: string) => (i18n ? i18n.t(key) : key);

    const projectId = request.params?.projectId;
    if (!projectId) {
      throw new BadRequestException(
        'Route is missing a :projectId param required by @ProjectRoles()',
      );
    }

    if (request.user?.platformRole === PlatformRole.SUPER_ADMIN) {
      return true;
    }

    const membership = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: request.user.id,
        isActive: true,
        role: { in: required },
      },
    });

    if (!membership) {
      throw new ForbiddenException(t('common.errors.forbidden'));
    }

    (request as AuthenticatedRequest & { projectMembership: typeof membership }).projectMembership =
      membership;

    return true;
  }
}
