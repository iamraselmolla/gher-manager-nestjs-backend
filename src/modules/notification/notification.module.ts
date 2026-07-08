import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { FcmService } from './fcm.service';
import { AdminSettingController } from './admin-setting.controller';
import { AdminSettingService } from './admin-setting.service';
import { ReminderProcessor } from './processors/reminder.processor';
import { ReminderSchedulerService } from './reminder-scheduler.service';
import { AppConfig } from '../../config/app.config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const { redis } = configService.getOrThrow<AppConfig>('app');
        return {
          connection: {
            host: redis.host,
            port: redis.port,
            password: redis.password,
          },
        };
      },
    }),
    BullModule.registerQueue({ name: 'reminders' }),
  ],
  controllers: [NotificationController, AdminSettingController],
  providers: [
    NotificationService,
    FcmService,
    AdminSettingService,
    ReminderProcessor,
    ReminderSchedulerService,
  ],
  exports: [NotificationService, AdminSettingService],
})
export class NotificationModule {}
