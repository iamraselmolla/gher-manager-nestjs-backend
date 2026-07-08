import { Module } from '@nestjs/common';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { SeasonModule } from '../season/season.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { NotificationModule } from '../notification/notification.module';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Module({
  imports: [SeasonModule, ActivityLogModule, NotificationModule],
  controllers: [ExpenseController],
  providers: [ExpenseService, ProjectRolesGuard],
  exports: [ExpenseService],
})
export class ExpenseModule {}
