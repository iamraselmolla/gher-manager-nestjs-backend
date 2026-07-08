import { Module } from '@nestjs/common';
import { SeasonClosingController } from './season-closing.controller';
import { SeasonClosingService } from './season-closing.service';
import { SeasonModule } from '../season/season.module';
import { SalesModule } from '../sales/sales.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { NotificationModule } from '../notification/notification.module';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Module({
  imports: [SeasonModule, SalesModule, ActivityLogModule, NotificationModule],
  controllers: [SeasonClosingController],
  providers: [SeasonClosingService, ProjectRolesGuard],
})
export class SeasonClosingModule {}
