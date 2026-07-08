import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ExpenseModule } from '../expense/expense.module';
import { FishModule } from '../fish/fish.module';
import { GrowthModule } from '../growth/growth.module';
import { MedicineModule } from '../medicine/medicine.module';
import { SalesModule } from '../sales/sales.module';
import { InvestmentModule } from '../investment/investment.module';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Module({
  imports: [
    ExpenseModule,
    FishModule,
    GrowthModule,
    MedicineModule,
    SalesModule,
    InvestmentModule,
  ],
  controllers: [ReportController],
  providers: [ReportService, ProjectRolesGuard],
})
export class ReportModule {}
