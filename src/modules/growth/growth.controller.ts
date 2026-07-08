import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { GrowthService } from './growth.service';
import { CreateGrowthCheckDto } from './dto/create-growth-check.dto';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';

@Controller('projects/:projectId/seasons/:seasonId')
@UseGuards(ProjectRolesGuard)
export class GrowthController {
  constructor(private readonly growthService: GrowthService) {}

  /** Season-wide feed for building a per-species growth trend graph. */
  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get('growth-checks')
  findAllForSeason(@Param('projectId') projectId: string, @Param('seasonId') seasonId: string) {
    return this.growthService.findAllForSeason(projectId, seasonId);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get('fish-batches/:batchId/growth-checks')
  findAllForBatch(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Param('batchId') batchId: string,
  ) {
    return this.growthService.findAllForBatch(projectId, seasonId, batchId);
  }

  @ProjectRoles(ProjectRole.EDITOR)
  @Post('fish-batches/:batchId/growth-checks')
  create(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Param('batchId') batchId: string,
    @Body() dto: CreateGrowthCheckDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.growthService.create(projectId, seasonId, batchId, dto, user.id);
  }

  @ProjectRoles(ProjectRole.EDITOR)
  @Delete('fish-batches/:batchId/growth-checks/:checkId')
  remove(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Param('batchId') batchId: string,
    @Param('checkId') checkId: string,
  ) {
    return this.growthService.remove(projectId, seasonId, batchId, checkId);
  }
}
