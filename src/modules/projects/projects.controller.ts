import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlatformRole, ProjectRole } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateProjectStatusDto } from './dto/update-project-status.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /** Only Admin creates a new Gher/project (per spec §4). */
  @UseGuards(PlatformRolesGuard)
  @Roles(PlatformRole.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: RequestUser) {
    return this.projectsService.create(dto, user.id);
  }

  /** Portfolio view — Admin sees everything, everyone else sees only their memberships. */
  @Get()
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    return this.projectsService.findAll(user, {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      search,
    });
  }

  @UseGuards(ProjectRolesGuard)
  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get(':projectId')
  findOne(@Param('projectId') projectId: string) {
    return this.projectsService.findById(projectId);
  }

  /** Investors are read-only platform-wide — only Editors (or Admin) may edit. */
  @UseGuards(ProjectRolesGuard)
  @ProjectRoles(ProjectRole.EDITOR)
  @Patch(':projectId')
  update(@Param('projectId') projectId: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(projectId, dto);
  }

  /** Closing/reopening a project is an Admin-only decision (mirrors season closing). */
  @UseGuards(PlatformRolesGuard)
  @Roles(PlatformRole.SUPER_ADMIN)
  @Patch(':projectId/status')
  updateStatus(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectStatusDto,
  ) {
    return this.projectsService.updateStatus(projectId, dto.status);
  }
}
