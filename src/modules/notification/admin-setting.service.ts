import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const SETTINGS_ID = 'singleton';

@Injectable()
export class AdminSettingService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    return this.prisma.adminSetting.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID },
      update: {},
    });
  }

  async update(followUpReminderLeadDays: number) {
    return this.prisma.adminSetting.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, followUpReminderLeadDays },
      update: { followUpReminderLeadDays },
    });
  }
}
