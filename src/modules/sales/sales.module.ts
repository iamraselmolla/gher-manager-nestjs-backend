import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { SeasonModule } from '../season/season.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Module({
  imports: [SeasonModule, ActivityLogModule],
  controllers: [SalesController],
  providers: [SalesService, ProjectRolesGuard],
  exports: [SalesService],
})
export class SalesModule {}
