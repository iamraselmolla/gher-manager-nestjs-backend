import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { FeedUsageService } from './feed-usage.service';
import { CreateFeedUsageDto } from './dto/create-feed-usage.dto';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';

@Controller('projects/:projectId/seasons/:seasonId/feed-usages')
@UseGuards(ProjectRolesGuard)
export class FeedUsageController {
  constructor(private readonly feedUsageService: FeedUsageService) {}

  @ProjectRoles(ProjectRole.EDITOR)
  @Post()
  create(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Body() dto: CreateFeedUsageDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.feedUsageService.create(projectId, seasonId, dto, user.id);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get()
  findAll(@Param('projectId') projectId: string, @Param('seasonId') seasonId: string) {
    return this.feedUsageService.findAllForSeason(projectId, seasonId);
  }

  /** "ফিড স্টক লেভেল" — remaining bags per feed type, for the dashboard. */
  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get('stock-summary')
  stockSummary(@Param('projectId') projectId: string, @Param('seasonId') seasonId: string) {
    return this.feedUsageService.getStockSummary(projectId, seasonId);
  }
}
