import { Request } from 'express';
import { PlatformRole } from '@prisma/client';

/** The shape `request.user` takes after JwtAuthGuard runs (see JwtStrategy.validate). */
export interface RequestUser {
  id: string;
  mobileNumber: string;
  platformRole: PlatformRole;
}

export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}
