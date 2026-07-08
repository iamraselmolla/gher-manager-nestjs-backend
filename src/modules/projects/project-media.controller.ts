import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { ProjectMediaService } from './project-media.service';
import { AddProjectMediaDto } from './dto/add-project-media.dto';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';

@Controller('projects/:projectId/media')
@UseGuards(ProjectRolesGuard)
export class ProjectMediaController {
  constructor(private readonly mediaService: ProjectMediaService) {}

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get()
  list(@Param('projectId') projectId: string) {
    return this.mediaService.list(projectId);
  }

  @ProjectRoles(ProjectRole.EDITOR)
  @Post()
  add(
    @Param('projectId') projectId: string,
    @Body() dto: AddProjectMediaDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.mediaService.add(projectId, dto, user.id);
  }

  @ProjectRoles(ProjectRole.EDITOR)
  @Delete(':mediaId')
  remove(@Param('projectId') projectId: string, @Param('mediaId') mediaId: string) {
    return this.mediaService.remove(projectId, mediaId);
  }
}
