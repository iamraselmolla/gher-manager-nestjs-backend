import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Thin wrapper around PrismaClient wired into Nest's lifecycle so the pool
 * connects on boot and drains cleanly on shutdown. Every module's
 * repository layer injects this instead of instantiating PrismaClient
 * directly, keeping a single connection pool for the whole app.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'stdout', level: 'error' },
              { emit: 'stdout', level: 'warn' },
            ]
          : [{ emit: 'stdout', level: 'error' }],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected to PostgreSQL');

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).$on('query', (e: { query: string; duration: number }) => {
        this.logger.debug(`${e.duration}ms  ${e.query}`);
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected');
  }

  /**
   * Helper for future season-close logic: runs a callback inside a single
   * transaction with sane defaults (used by modules that must update
   * several tables atomically, e.g. season closing / profit distribution).
   */
  async runInTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction((tx: Prisma.TransactionClient) => fn(tx), {
      maxWait: 10_000,
      timeout: 20_000,
    });
  }
}
