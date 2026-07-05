import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppConfig } from '../config/app.config';

/**
 * Thin caching facade over ioredis. Feature modules should go through this
 * service (get/set/del/getOrSet) rather than importing ioredis directly, so
 * cache-key conventions and TTL policy stay consistent platform-wide.
 *
 * Reserved key namespaces (extend as modules land):
 *   dashboard:{projectId}:{seasonId}
 *   report:{projectId}:{seasonId}:{reportType}
 *   feed-stock:{projectId}:{seasonId}
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public client: Redis;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    const { redis } = this.configService.getOrThrow<AppConfig>('app');
    this.client = new Redis({
      host: redis.host,
      port: redis.port,
      password: redis.password,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log(
        `Redis connected (${this.client.options.host}:${this.client.options.port})`,
      );
    } catch (err) {
      this.logger.error(`Redis connection failed: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy() {
    this.client.disconnect();
  }

  async get<T = string>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const payload = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, payload, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, payload);
    }
  }

  async del(key: string | string[]): Promise<void> {
    await this.client.del(...(Array.isArray(key) ? key : [key]));
  }

  /** Delete every key matching a prefix, e.g. invalidating a project's cached dashboard. */
  async delByPrefix(prefix: string): Promise<void> {
    const stream = this.client.scanStream({ match: `${prefix}*` });
    const keys: string[] = [];
    for await (const chunk of stream) {
      keys.push(...(chunk as string[]));
    }
    if (keys.length) await this.client.del(...keys);
  }

  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await fn();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}
