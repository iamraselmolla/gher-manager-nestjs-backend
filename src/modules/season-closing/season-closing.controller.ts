import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PlatformRole, ProjectRole } from '@prisma/client';
import { SeasonClosingService } from './season-closing.service';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';

@Controller('projects/:projectId/seasons/:seasonId/closing')
@UseGuards(ProjectRolesGuard)
export class SeasonClosingController {
  constructor(private readonly seasonClosingService: SeasonClosingService) {}

  /** Admin reviews this before confirming — nothing is written yet. */
  @UseGuards(PlatformRolesGuard)
  @Roles(PlatformRole.SUPER_ADMIN)
  @Get('preview')
  preview(@Param('projectId') projectId: string, @Param('seasonId') seasonId: string) {
    return this.seasonClosingService.preview(projectId, seasonId);
  }

  @UseGuards(PlatformRolesGuard)
  @Roles(PlatformRole.SUPER_ADMIN)
  @Post('confirm')
  confirm(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.seasonClosingService.confirmClose(projectId, seasonId, user.id);
  }

  /** Once closed, everyone can see the final settlement breakdown. */
  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get('settlements')
  getSettlements(@Param('projectId') projectId: string, @Param('seasonId') seasonId: string) {
    return this.seasonClosingService.getSettlements(projectId, seasonId);
  }
}
