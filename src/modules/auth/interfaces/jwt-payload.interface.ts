import { PlatformRole } from '@prisma/client';

/** Claims embedded in both the access and refresh JWTs. */
export interface JwtPayload {
  sub: string; // user id
  mobileNumber: string;
  platformRole: PlatformRole;
}

/** Extra claim on refresh tokens only, ties the JWT to its DB row for revocation checks. */
export interface RefreshJwtPayload extends JwtPayload {
  tokenId: string;
}
