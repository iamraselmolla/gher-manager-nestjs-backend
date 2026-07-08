import { Module } from '@nestjs/common';
import { WaterQualityController } from './water-quality.controller';
import { WaterQualityService } from './water-quality.service';
import { SeasonModule } from '../season/season.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Module({
  imports: [SeasonModule, ActivityLogModule],
  controllers: [WaterQualityController],
  providers: [WaterQualityService, ProjectRolesGuard],
  exports: [WaterQualityService],
})
export class WaterQualityModule {}
