import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import { PlatformRole, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfig } from '../../config/app.config';
import {
  comparePassword,
  hashPassword,
} from '../../common/utils/password.util';
import { generateSecureToken, hashToken } from '../../common/utils/token.util';
import { JwtPayload, RefreshJwtPayload } from './interfaces/jwt-payload.interface';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface SafeUser {
  id: string;
  mobileNumber: string;
  name: string;
  platformRole: PlatformRole;
  preferredLanguage: string;
  mustChangePassword: boolean;
}

const RESET_TOKEN_TTL_MINUTES = 30;

@Injectable()
export class AuthService {
  private readonly jwtConfig: AppConfig['jwt'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {
    this.jwtConfig = this.configService.getOrThrow<AppConfig>('app').jwt;
  }

  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      mobileNumber: user.mobileNumber,
      name: user.name,
      platformRole: user.platformRole,
      preferredLanguage: user.preferredLanguage,
      mustChangePassword: user.mustChangePassword,
    };
  }

  private signAccessToken(user: Pick<User, 'id' | 'mobileNumber' | 'platformRole'>): string {
    const payload: JwtPayload = {
      sub: user.id,
      mobileNumber: user.mobileNumber,
      platformRole: user.platformRole,
    };
    return this.jwtService.sign(payload, {
      secret: this.jwtConfig.accessSecret,
      expiresIn: this.jwtConfig.accessExpiresIn,
    });
  }

  /** Issues a fresh access+refresh pair and persists the refresh token's hash. */
  private async issueTokenPair(
    user: Pick<User, 'id' | 'mobileNumber' | 'platformRole'>,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<TokenPair> {
    const accessToken = this.signAccessToken(user);

    // Create the DB row first so we have a tokenId to embed in the JWT itself.
    const expiresAt = new Date(
      Date.now() + this.parseExpiryMs(this.jwtConfig.refreshExpiresIn),
    );
    const tokenRow = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: 'pending', // replaced below once we know the signed value
        expiresAt,
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
      },
    });

    const refreshPayload: RefreshJwtPayload = {
      sub: user.id,
      mobileNumber: user.mobileNumber,
      platformRole: user.platformRole,
      tokenId: tokenRow.id,
    };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.jwtConfig.refreshSecret,
      expiresIn: this.jwtConfig.refreshExpiresIn,
    });

    await this.prisma.refreshToken.update({
      where: { id: tokenRow.id },
      data: { tokenHash: hashToken(refreshToken) },
    });

    return { accessToken, refreshToken };
  }

  private parseExpiryMs(expiresIn: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiresIn.trim());
    if (!match) return 30 * 24 * 60 * 60 * 1000; // fallback: 30 days
    const value = parseInt(match[1], 10);
    const unitMap: Record<'s' | 'm' | 'h' | 'd', number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    const unit = unitMap[match[2] as 's' | 'm' | 'h' | 'd'];
    return value * unit;
  }

  async login(
    mobileNumber: string,
    password: string,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<{ user: SafeUser } & TokenPair> {
    const user = await this.prisma.user.findUnique({ where: { mobileNumber } });

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw new UnauthorizedException(this.i18n.t('auth.invalid_credentials'));
    }
    if (!user.isActive) {
      throw new UnauthorizedException(this.i18n.t('auth.account_inactive'));
    }

    const tokens = await this.issueTokenPair(user, meta);
    return { user: this.toSafeUser(user), ...tokens };
  }

  /**
   * Rotation with reuse detection: a refresh token can only ever be used
   * once. If a token that's already been rotated (revoked) shows up again
   * with a valid signature, that's a strong signal it was stolen — every
   * other active session for that user is revoked immediately as a
   * precaution, and the caller is asked to log in again.
   */
  async refresh(
    refreshToken: string,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<TokenPair> {
    let payload: RefreshJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshJwtPayload>(
        refreshToken,
        { secret: this.jwtConfig.refreshSecret },
      );
    } catch {
      throw new UnauthorizedException(this.i18n.t('auth.invalid_or_expired_token'));
    }

    const tokenRow = await this.prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
    });

    if (!tokenRow || tokenRow.tokenHash !== hashToken(refreshToken)) {
      throw new UnauthorizedException(this.i18n.t('auth.invalid_or_expired_token'));
    }

    if (tokenRow.revoked) {
      // Reuse of an already-rotated token — treat as compromised.
      await this.prisma.refreshToken.updateMany({
        where: { userId: tokenRow.userId, revoked: false },
        data: { revoked: true },
      });
      throw new UnauthorizedException(this.i18n.t('auth.invalid_or_expired_token'));
    }

    if (tokenRow.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException(this.i18n.t('auth.invalid_or_expired_token'));
    }

    const user = await this.prisma.user.findUnique({ where: { id: tokenRow.userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException(this.i18n.t('auth.account_inactive'));
    }

    await this.prisma.refreshToken.update({
      where: { id: tokenRow.id },
      data: { revoked: true },
    });

    return this.issueTokenPair(user, meta);
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshJwtPayload>(
        refreshToken,
        { secret: this.jwtConfig.refreshSecret },
      );
      await this.prisma.refreshToken.updateMany({
        where: { id: payload.tokenId },
        data: { revoked: true },
      });
    } catch {
      // Invalid/expired token being logged out is a no-op, not an error.
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (!(await comparePassword(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException(this.i18n.t('auth.current_password_incorrect'));
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await hashPassword(newPassword),
        mustChangePassword: false,
      },
    });

    // Force re-login on every other device once the password changes.
    await this.logoutAll(userId);
  }

  /**
   * Generates a reset token and returns the RAW value to the caller so an
   * SMS/email dispatch integration can be wired in later without touching
   * this method's contract. Always resolves successfully (even for unknown
   * numbers) so the endpoint can't be used to enumerate registered accounts.
   */
  async forgotPassword(mobileNumber: string): Promise<{ rawToken: string } | null> {
    const user = await this.prisma.user.findUnique({ where: { mobileNumber } });
    if (!user) return null;

    const rawToken = generateSecureToken();
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000),
      },
    });

    return { rawToken };
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(resetToken);
    const tokenRow = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (
      !tokenRow ||
      tokenRow.used ||
      tokenRow.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException(this.i18n.t('auth.invalid_or_expired_token'));
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: tokenRow.userId },
        data: {
          passwordHash: await hashPassword(newPassword),
          mustChangePassword: false,
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: tokenRow.id },
        data: { used: true },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: tokenRow.userId, revoked: false },
        data: { revoked: true },
      }),
    ]);
  }

  async me(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.toSafeUser(user);
  }
}
