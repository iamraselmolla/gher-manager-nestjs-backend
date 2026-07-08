import { Module } from '@nestjs/common';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { FeedPurchaseController } from './feed-purchase.controller';
import { FeedPurchaseService } from './feed-purchase.service';
import { FeedUsageController } from './feed-usage.controller';
import { FeedUsageService } from './feed-usage.service';
import { SeasonModule } from '../season/season.module';
import { ExpenseModule } from '../expense/expense.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { NotificationModule } from '../notification/notification.module';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Module({
  imports: [SeasonModule, ExpenseModule, ActivityLogModule, NotificationModule],
  controllers: [VendorController, FeedPurchaseController, FeedUsageController],
  providers: [VendorService, FeedPurchaseService, FeedUsageService, ProjectRolesGuard],
  exports: [FeedUsageService],
})
export class FeedModule {}
