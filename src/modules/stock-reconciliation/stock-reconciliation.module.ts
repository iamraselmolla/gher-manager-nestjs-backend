import { Module } from '@nestjs/common';
import { StockReconciliationController } from './stock-reconciliation.controller';
import { StockReconciliationService } from './stock-reconciliation.service';
import { SeasonModule } from '../season/season.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { NotificationModule } from '../notification/notification.module';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Module({
  imports: [SeasonModule, ActivityLogModule, NotificationModule],
  controllers: [StockReconciliationController],
  providers: [StockReconciliationService, ProjectRolesGuard],
})
export class StockReconciliationModule {}
