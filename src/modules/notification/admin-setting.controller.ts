import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { PlatformRole } from '@prisma/client';
import { AdminSettingService } from './admin-setting.service';
import { UpdateAdminSettingDto } from './dto/update-admin-setting.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';

@Controller('admin/settings')
@UseGuards(PlatformRolesGuard)
@Roles(PlatformRole.SUPER_ADMIN)
export class AdminSettingController {
  constructor(private readonly adminSettingService: AdminSettingService) {}

  @Get()
  get() {
    return this.adminSettingService.get();
  }

  /** Configurable reminder lead time (default 2 days), per spec §5.5. */
  @Patch()
  update(@Body() dto: UpdateAdminSettingDto) {
    return this.adminSettingService.update(dto.followUpReminderLeadDays);
  }
}
