import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import appConfig from './config/app.config';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { i18nModuleConfig } from './i18n/i18n.config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { PlatformRolesGuard } from './modules/auth/guards/platform-roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [appConfig],
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10) * 1000,
            limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
          },
        ],
      }),
    }),
    PrismaModule,
    RedisModule,
    i18nModuleConfig,
    HealthModule,
    AuthModule,
    UsersModule,
    // Future feature modules register here, one per approved build step:
    // MembersModule (ProjectMember/RBAC), ProjectModule, SeasonModule,
    // FishModule, GrowthModule, FeedModule, VendorLedgerModule,
    // MedicineModule, TreatmentModule, ExpenseModule, SalesModule,
    // InvestmentModule, PartnerModule, WaterQualityModule,
    // NotificationModule, ReportModule, DashboardModule, MediaModule
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Auth guard runs before role guard: authenticate first, authorize second.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PlatformRolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
