import { Module } from '@nestjs/common';
import { FishSpeciesController } from './fish-species.controller';
import { FishSpeciesService } from './fish-species.service';
import { FishBatchController } from './fish-batch.controller';
import { FishBatchService } from './fish-batch.service';
import { SeasonModule } from '../season/season.module';
import { ExpenseModule } from '../expense/expense.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Module({
  imports: [SeasonModule, ExpenseModule, ActivityLogModule],
  controllers: [FishSpeciesController, FishBatchController],
  providers: [FishSpeciesService, FishBatchService, ProjectRolesGuard],
  exports: [FishSpeciesService, FishBatchService],
})
export class FishModule {}
