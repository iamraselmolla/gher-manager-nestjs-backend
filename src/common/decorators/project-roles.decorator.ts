import { SetMetadata } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';

export const PROJECT_ROLES_KEY = 'projectRoles';

/**
 * Project-scoped RBAC — the workhorse decorator every future module
 * (Fish, Feed, Expense, Sales, ...) will use to guard its endpoints:
 *
 *   @ProjectRoles(ProjectRole.EDITOR)                    // write endpoints
 *   @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR) // read endpoints
 *
 * Requires the route to have a `:projectId` param. Platform SUPER_ADMIN
 * always bypasses this check (full access to every project, per spec).
 * See `ProjectRolesGuard`.
 */
export const ProjectRoles = (...roles: ProjectRole[]) =>
  SetMetadata(PROJECT_ROLES_KEY, roles);
