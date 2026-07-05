import { Controller, Get } from '@nestjs/common';
import { I18n, I18nContext } from 'nestjs-i18n';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

interface HealthCheckResult {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  database: { ok: boolean; message: string };
  redis: { ok: boolean; message: string };
  timestamp: string;
}

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check(@I18n() i18n: I18nContext): Promise<HealthCheckResult> {
    const database = await this.checkDatabase(i18n);
    const redis = await this.checkRedis(i18n);

    return {
      status: database.ok && redis.ok ? 'ok' : 'degraded',
      uptimeSeconds: Math.floor(process.uptime()),
      database,
      redis,
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(i18n: I18nContext) {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true, message: i18n.t('common.health.db_ok') };
    } catch {
      return { ok: false, message: i18n.t('common.health.db_fail') };
    }
  }

  private async checkRedis(i18n: I18nContext) {
    try {
      const pong = await this.redis.client.ping();
      return { ok: pong === 'PONG', message: i18n.t('common.health.redis_ok') };
    } catch {
      return { ok: false, message: i18n.t('common.health.redis_fail') };
    }
  }
}
