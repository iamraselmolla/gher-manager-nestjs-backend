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
import { PlatformRole, ProjectRole } from '@prisma/client';
import { PartnerService } from './partner.service';
import { AddPartnerDto } from './dto/add-partner.dto';
import { UpdatePartnerShareDto } from './dto/update-partner-share.dto';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';

@Controller('projects/:projectId/partners')
@UseGuards(ProjectRolesGuard)
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  /** Adding a partner is Editor/Admin, per spec: "entered by Editor or Admin". */
  @ProjectRoles(ProjectRole.EDITOR)
  @Post()
  addPartner(
    @Param('projectId') projectId: string,
    @Body() dto: AddPartnerDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.partnerService.addPartner(projectId, dto, user.id);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.partnerService.findAll(projectId);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get('share-summary')
  shareSummary(@Param('projectId') projectId: string) {
    return this.partnerService.shareSummary(projectId);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get(':partnerId')
  findOne(@Param('projectId') projectId: string, @Param('partnerId') partnerId: string) {
    return this.partnerService.findById(projectId, partnerId);
  }

  @ProjectRoles(ProjectRole.EDITOR)
  @Patch(':partnerId/share')
  updateShare(
    @Param('projectId') projectId: string,
    @Param('partnerId') partnerId: string,
    @Body() dto: UpdatePartnerShareDto,
  ) {
    return this.partnerService.updateShare(projectId, partnerId, dto);
  }

  /**
   * Removal reaches into platform user access (deactivating ProjectMember),
   * so it's kept Admin-only for safety even though the spec allows
   * Editor-level partner entry — a conservative, defensible choice noted in
   * PROJECT_STATE.md.
   */
  @UseGuards(PlatformRolesGuard)
  @Roles(PlatformRole.SUPER_ADMIN)
  @Delete(':partnerId')
  remove(@Param('projectId') projectId: string, @Param('partnerId') partnerId: string) {
    return this.partnerService.remove(projectId, partnerId);
  }
}
