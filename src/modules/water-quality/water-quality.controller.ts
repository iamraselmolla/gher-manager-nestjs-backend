import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { WaterQualityService } from './water-quality.service';
import { CreateWaterQualityCheckDto } from './dto/create-water-quality-check.dto';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';

@Controller('projects/:projectId/seasons/:seasonId/water-quality-checks')
@UseGuards(ProjectRolesGuard)
export class WaterQualityController {
  constructor(private readonly waterQualityService: WaterQualityService) {}

  @ProjectRoles(ProjectRole.EDITOR)
  @Post()
  create(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Body() dto: CreateWaterQualityCheckDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.waterQualityService.create(projectId, seasonId, dto, user.id);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get()
  findAll(@Param('projectId') projectId: string, @Param('seasonId') seasonId: string) {
    return this.waterQualityService.findAllForSeason(projectId, seasonId);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get('latest')
  findLatest(@Param('projectId') projectId: string, @Param('seasonId') seasonId: string) {
    return this.waterQualityService.findLatest(projectId, seasonId);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get(':checkId')
  findOne(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Param('checkId') checkId: string,
  ) {
    return this.waterQualityService.findById(projectId, seasonId, checkId);
  }
}
