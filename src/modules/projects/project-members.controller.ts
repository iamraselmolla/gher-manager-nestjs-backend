import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { ProjectMembersService } from './project-members.service';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Controller('projects/:projectId/members')
@UseGuards(ProjectRolesGuard)
export class ProjectMembersController {
  constructor(private readonly membersService: ProjectMembersService) {}

  /** Editors and Investors can both see who's on the project; only Editors/Admin manage it. */
  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get()
  list(@Param('projectId') projectId: string) {
    return this.membersService.list(projectId);
  }

  @ProjectRoles(ProjectRole.EDITOR)
  @Post()
  add(@Param('projectId') projectId: string, @Body() dto: AddProjectMemberDto) {
    return this.membersService.add(projectId, dto.mobileNumber, dto.role);
  }

  @ProjectRoles(ProjectRole.EDITOR)
  @Patch(':memberId')
  updateRole(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateProjectMemberDto,
  ) {
    return this.membersService.updateRole(projectId, memberId, dto.role);
  }

  @ProjectRoles(ProjectRole.EDITOR)
  @Delete(':memberId')
  remove(@Param('projectId') projectId: string, @Param('memberId') memberId: string) {
    return this.membersService.remove(projectId, memberId);
  }
}
