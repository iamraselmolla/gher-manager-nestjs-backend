import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { MedicineStockService } from './medicine-stock.service';
import { CreateMedicineStockDto } from './dto/create-medicine-stock.dto';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';

@Controller('projects/:projectId/seasons/:seasonId/medicine-stocks')
@UseGuards(ProjectRolesGuard)
export class MedicineStockController {
  constructor(private readonly medicineStockService: MedicineStockService) {}

  @ProjectRoles(ProjectRole.EDITOR)
  @Post()
  create(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Body() dto: CreateMedicineStockDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.medicineStockService.create(projectId, seasonId, dto, user.id);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get()
  findAll(@Param('projectId') projectId: string, @Param('seasonId') seasonId: string) {
    return this.medicineStockService.findAllForSeason(projectId, seasonId);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get(':stockId')
  findOne(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Param('stockId') stockId: string,
  ) {
    return this.medicineStockService.findById(projectId, seasonId, stockId);
  }
}
