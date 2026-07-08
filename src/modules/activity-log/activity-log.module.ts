import { Module } from '@nestjs/common';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogService } from './activity-log.service';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Module({
  controllers: [ActivityLogController],
  providers: [ActivityLogService, ProjectRolesGuard],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
