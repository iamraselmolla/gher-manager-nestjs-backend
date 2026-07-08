import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ProjectRole, StockItemType } from '@prisma/client';
import { StockReconciliationService } from './stock-reconciliation.service';
import { CreateStockCheckpointDto } from './dto/create-stock-checkpoint.dto';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';

@Controller('projects/:projectId/seasons/:seasonId/stock-checkpoints')
@UseGuards(ProjectRolesGuard)
export class StockReconciliationController {
  constructor(private readonly reconciliationService: StockReconciliationService) {}

  @ProjectRoles(ProjectRole.EDITOR)
  @Post()
  create(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Body() dto: CreateStockCheckpointDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.reconciliationService.create(projectId, seasonId, dto, user.id);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get()
  findAll(@Param('projectId') projectId: string, @Param('seasonId') seasonId: string) {
    return this.reconciliationService.findAllForSeason(projectId, seasonId);
  }

  /** History for one specific item (e.g. one feed name, or one medicine) — for its own checkpoint timeline. */
  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get('by-item')
  findAllForItem(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Query('itemType') itemType: StockItemType,
    @Query('itemKey') itemKey: string,
  ) {
    return this.reconciliationService.findAllForItem(projectId, seasonId, itemType, itemKey);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get(':checkpointId')
  findOne(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Param('checkpointId') checkpointId: string,
  ) {
    return this.reconciliationService.findById(projectId, seasonId, checkpointId);
  }
}
