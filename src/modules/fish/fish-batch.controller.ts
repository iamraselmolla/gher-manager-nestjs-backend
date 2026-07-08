import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { FishBatchService } from './fish-batch.service';
import { CreateFishBatchDto } from './dto/create-fish-batch.dto';
import { UpdateFishBatchDto } from './dto/update-fish-batch.dto';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';

@Controller('projects/:projectId/seasons/:seasonId/fish-batches')
@UseGuards(ProjectRolesGuard)
export class FishBatchController {
  constructor(private readonly fishBatchService: FishBatchService) {}

  @ProjectRoles(ProjectRole.EDITOR)
  @Post()
  create(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Body() dto: CreateFishBatchDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.fishBatchService.create(projectId, seasonId, dto, user.id);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get()
  findAll(@Param('projectId') projectId: string, @Param('seasonId') seasonId: string) {
    return this.fishBatchService.findAllForSeason(projectId, seasonId);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get(':batchId')
  findOne(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Param('batchId') batchId: string,
  ) {
    return this.fishBatchService.findById(projectId, seasonId, batchId);
  }

  @ProjectRoles(ProjectRole.EDITOR)
  @Patch(':batchId')
  update(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Param('batchId') batchId: string,
    @Body() dto: UpdateFishBatchDto,
  ) {
    return this.fishBatchService.update(projectId, seasonId, batchId, dto);
  }
}
