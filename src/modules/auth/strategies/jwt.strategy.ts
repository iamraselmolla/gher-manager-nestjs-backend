import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { I18nService } from 'nestjs-i18n';
import { AppConfig } from '../../../config/app.config';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RequestUser } from '../interfaces/authenticated-request.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<AppConfig>('app').jwt.accessSecret,
    });
  }

  /**
   * Runs once per authenticated request, after signature/expiry checks
   * already passed. We still hit the DB to make sure the account wasn't
   * deactivated *after* the token was issued (deactivation must take effect
   * immediately, not after the access token naturally expires in 15m).
   */
  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, mobileNumber: true, platformRole: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        this.i18n.t('auth.account_inactive'),
      );
    }

    return {
      id: user.id,
      mobileNumber: user.mobileNumber,
      platformRole: user.platformRole,
    };
  }
}
