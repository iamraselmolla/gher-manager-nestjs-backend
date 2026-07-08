import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { ActivityLogService } from './activity-log.service';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Controller('projects/:projectId/activity-logs')
@UseGuards(ProjectRolesGuard)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  /** Visible to Editors and Investors alike, per spec §5.10. Optional ?seasonId to scope to one cycle. */
  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Query('seasonId') seasonId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.activityLogService.findAllForProject(projectId, {
      seasonId,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
