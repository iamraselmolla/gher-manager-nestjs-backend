import { Module } from '@nestjs/common';
import { PartnerController } from './partner.controller';
import { PartnerService } from './partner.service';
import { PartnerLedgerController } from './partner-ledger.controller';
import { PartnerLedgerService } from './partner-ledger.service';
import { SeasonModule } from '../season/season.module';
import { UsersModule } from '../users/users.module';
import { ProjectsModule } from '../projects/projects.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { NotificationModule } from '../notification/notification.module';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Module({
  imports: [SeasonModule, UsersModule, ProjectsModule, ActivityLogModule, NotificationModule],
  controllers: [PartnerController, PartnerLedgerController],
  providers: [PartnerService, PartnerLedgerService, ProjectRolesGuard],
  exports: [PartnerService, PartnerLedgerService],
})
export class InvestmentModule {}
