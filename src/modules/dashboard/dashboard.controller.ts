import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Controller('projects/:projectId/seasons/:seasonId/dashboard')
@UseGuards(ProjectRolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get()
  getDashboard(@Param('projectId') projectId: string, @Param('seasonId') seasonId: string) {
    return this.dashboardService.getDashboard(projectId, seasonId);
  }
}
