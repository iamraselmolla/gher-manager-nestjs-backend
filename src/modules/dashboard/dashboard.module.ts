import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { SeasonModule } from '../season/season.module';
import { FishModule } from '../fish/fish.module';
import { FeedModule } from '../feed/feed.module';
import { MedicineModule } from '../medicine/medicine.module';
import { WaterQualityModule } from '../water-quality/water-quality.module';
import { SalesModule } from '../sales/sales.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Module({
  imports: [
    SeasonModule,
    FishModule,
    FeedModule,
    MedicineModule,
    WaterQualityModule,
    SalesModule,
    ActivityLogModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService, ProjectRolesGuard],
})
export class DashboardModule {}
