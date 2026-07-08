import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectMembersController } from './project-members.controller';
import { ProjectMembersService } from './project-members.service';
import { ProjectMediaController } from './project-media.controller';
import { ProjectMediaService } from './project-media.service';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Module({
  controllers: [ProjectsController, ProjectMembersController, ProjectMediaController],
  providers: [
    ProjectsService,
    ProjectMembersService,
    ProjectMediaService,
    // Registered here so Nest's DI can construct it for @UseGuards(ProjectRolesGuard)
    // in this module's controllers. Every future module that nests routes under
    // `/projects/:projectId/...` should add ProjectRolesGuard to its own
    // providers array the same way (it only depends on globally-provided
    // PrismaService + Nest's built-in Reflector, so this is just DI wiring,
    // not duplicated logic).
    ProjectRolesGuard,
  ],
  exports: [ProjectsService, ProjectMembersService],
})
export class ProjectsModule {}
