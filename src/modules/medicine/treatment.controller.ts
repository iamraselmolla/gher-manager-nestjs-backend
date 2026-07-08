import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { TreatmentService } from './treatment.service';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';

@Controller('projects/:projectId/seasons/:seasonId/treatments')
@UseGuards(ProjectRolesGuard)
export class TreatmentController {
  constructor(private readonly treatmentService: TreatmentService) {}

  @ProjectRoles(ProjectRole.EDITOR)
  @Post()
  create(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Body() dto: CreateTreatmentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.treatmentService.create(projectId, seasonId, dto, user.id);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get()
  findAll(@Param('projectId') projectId: string, @Param('seasonId') seasonId: string) {
    return this.treatmentService.findAllForSeason(projectId, seasonId);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get('upcoming-follow-ups')
  upcomingFollowUps(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
  ) {
    return this.treatmentService.findUpcomingFollowUps(projectId, seasonId);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get(':treatmentId')
  findOne(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Param('treatmentId') treatmentId: string,
  ) {
    return this.treatmentService.findById(projectId, seasonId, treatmentId);
  }

  @ProjectRoles(ProjectRole.EDITOR)
  @Patch(':treatmentId')
  update(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Param('treatmentId') treatmentId: string,
    @Body() dto: UpdateTreatmentDto,
  ) {
    return this.treatmentService.update(projectId, seasonId, treatmentId, dto);
  }
}
