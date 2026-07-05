import { SetMetadata } from '@nestjs/common';
import { PlatformRole } from '@prisma/client';

export const ROLES_KEY = 'platformRoles';

/**
 * Platform-level role guard only (e.g. `@Roles('SUPER_ADMIN')` for
 * platform-wide admin endpoints like season closing or user management).
 * Project-scoped Editor/Investor permissions are enforced separately by a
 * ProjectRolesGuard added alongside ProjectMember in the Project module —
 * this decorator does not (and should not) know about project membership.
 */
export const Roles = (...roles: PlatformRole[]) => SetMetadata(ROLES_KEY, roles);
