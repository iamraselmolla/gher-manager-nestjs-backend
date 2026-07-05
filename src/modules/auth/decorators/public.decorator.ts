import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route (or entire controller) as not requiring authentication.
 * JwtAuthGuard is registered globally (APP_GUARD) — every route is locked
 * down by default; this is the explicit opt-out for login, refresh,
 * forgot/reset-password, and health check.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
