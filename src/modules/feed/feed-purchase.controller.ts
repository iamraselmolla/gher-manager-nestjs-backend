import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { FeedPurchaseService } from './feed-purchase.service';
import { CreateFeedPurchaseDto } from './dto/create-feed-purchase.dto';
import { UpdateFeedPurchaseDto } from './dto/update-feed-purchase.dto';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';

@Controller('projects/:projectId/seasons/:seasonId/feed-purchases')
@UseGuards(ProjectRolesGuard)
export class FeedPurchaseController {
  constructor(private readonly feedPurchaseService: FeedPurchaseService) {}

  @ProjectRoles(ProjectRole.EDITOR)
  @Post()
  create(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Body() dto: CreateFeedPurchaseDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.feedPurchaseService.create(projectId, seasonId, dto, user.id);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get()
  findAll(@Param('projectId') projectId: string, @Param('seasonId') seasonId: string) {
    return this.feedPurchaseService.findAllForSeason(projectId, seasonId);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get(':purchaseId')
  findOne(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Param('purchaseId') purchaseId: string,
  ) {
    return this.feedPurchaseService.findById(projectId, seasonId, purchaseId);
  }

  @ProjectRoles(ProjectRole.EDITOR)
  @Patch(':purchaseId')
  update(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Param('purchaseId') purchaseId: string,
    @Body() dto: UpdateFeedPurchaseDto,
  ) {
    return this.feedPurchaseService.update(projectId, seasonId, purchaseId, dto);
  }
}
