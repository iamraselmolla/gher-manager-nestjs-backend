import { Module } from '@nestjs/common';
import { GrowthController } from './growth.controller';
import { GrowthService } from './growth.service';
import { SeasonModule } from '../season/season.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Module({
  imports: [SeasonModule, ActivityLogModule],
  controllers: [GrowthController],
  providers: [GrowthService, ProjectRolesGuard],
  exports: [GrowthService],
})
export class GrowthModule {}
