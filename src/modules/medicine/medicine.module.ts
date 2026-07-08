import { Module } from '@nestjs/common';
import { MedicineController } from './medicine.controller';
import { MedicineService } from './medicine.service';
import { MedicineStockController } from './medicine-stock.controller';
import { MedicineStockService } from './medicine-stock.service';
import { TreatmentController } from './treatment.controller';
import { TreatmentService } from './treatment.service';
import { SeasonModule } from '../season/season.module';
import { ExpenseModule } from '../expense/expense.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { NotificationModule } from '../notification/notification.module';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Module({
  imports: [SeasonModule, ExpenseModule, ActivityLogModule, NotificationModule],
  controllers: [MedicineController, MedicineStockController, TreatmentController],
  providers: [
    MedicineService,
    MedicineStockService,
    TreatmentService,
    ProjectRolesGuard,
  ],
  exports: [MedicineService, TreatmentService, MedicineStockService],
})
export class MedicineModule {}
