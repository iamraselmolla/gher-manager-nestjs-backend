import { Module } from '@nestjs/common';
import { SeasonController } from './season.controller';
import { SeasonsService } from './season.service';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Module({
  controllers: [SeasonController],
  providers: [SeasonsService, ProjectRolesGuard],
  exports: [SeasonsService],
})
export class SeasonModule {}
