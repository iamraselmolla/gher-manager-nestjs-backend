import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PlatformRole, ProjectRole } from '@prisma/client';
import { SeasonsService } from './season.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';

@Controller('projects/:projectId/seasons')
@UseGuards(ProjectRolesGuard)
export class SeasonController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @ProjectRoles(ProjectRole.EDITOR)
  @Post()
  create(@Param('projectId') projectId: string, @Body() dto: CreateSeasonDto) {
    return this.seasonsService.create(projectId, dto);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.seasonsService.findAllForProject(projectId);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get('active')
  findActive(@Param('projectId') projectId: string) {
    return this.seasonsService.findActiveForProject(projectId);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get(':seasonId')
  findOne(@Param('projectId') projectId: string, @Param('seasonId') seasonId: string) {
    return this.seasonsService.findById(projectId, seasonId);
  }

  @ProjectRoles(ProjectRole.EDITOR)
  @Patch(':seasonId')
  update(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Body() dto: UpdateSeasonDto,
  ) {
    return this.seasonsService.update(projectId, seasonId, dto);
  }

  /**
   * Admin-only mechanical close (status flip + read-only lock), per spec
   * §5.13. Deliberately does NOT carry `@ProjectRoles()` — that would let
   * project Editors close seasons too, which the spec reserves for Admin.
   * `PlatformRolesGuard` here enforces SUPER_ADMIN; the class-level
   * `ProjectRolesGuard` still runs but is a no-op with no roles required,
   * SUPER_ADMIN bypasses it anyway. Full profit/loss + partner-distribution
   * workflow is added on top of this same action by the Season Closing
   * module (#16) — see SeasonsService.
   */
  @UseGuards(PlatformRolesGuard)
  @Roles(PlatformRole.SUPER_ADMIN)
  @Patch(':seasonId/close')
  close(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.seasonsService.close(projectId, seasonId, user.id);
  }
}
