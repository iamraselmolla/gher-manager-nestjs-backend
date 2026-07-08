import { ProjectMember } from '@prisma/client';
import { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';

/** Request shape after `ProjectRolesGuard` has run successfully. */
export interface ProjectScopedRequest extends AuthenticatedRequest {
  projectMembership?: ProjectMember;
}
