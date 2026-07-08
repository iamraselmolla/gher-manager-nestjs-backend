import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationService } from '../notification.service';
import { AdminSettingService } from '../admin-setting.service';

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * Runs on a daily repeatable job (see ReminderSchedulerService). Scans
 * Treatment rows for two kinds of due reminders — configurable-days-before
 * and due-date-itself — per spec §5.5. Each treatment fires each reminder
 * at most once, tracked via `leadReminderSentAt`/`dueReminderSentAt`.
 */
@Processor('reminders')
export class ReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly adminSettingService: AdminSettingService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== 'scan-follow-ups') return;

    const settings = await this.adminSettingService.get();
    const today = startOfDay(new Date());
    const leadDate = addDays(today, settings.followUpReminderLeadDays);

    await this.sendBatch(
      { gte: leadDate, lt: addDays(leadDate, 1) },
      'leadReminderSentAt',
      'treatment_followup_lead_reminder',
    );
    await this.sendBatch(
      { gte: today, lt: addDays(today, 1) },
      'dueReminderSentAt',
      'treatment_followup_due_reminder',
    );
  }

  private async sendBatch(
    dateRange: { gte: Date; lt: Date },
    sentAtField: 'leadReminderSentAt' | 'dueReminderSentAt',
    actionKey: string,
  ) {
    const candidates = await this.prisma.treatment.findMany({
      where: {
        nextFollowUpDate: dateRange,
        [sentAtField]: null,
      },
      include: { medicine: true },
    });

    for (const treatment of candidates) {
      await this.notificationService.sendToProjectMembers(
        treatment.projectId,
        {
          title:
            actionKey === 'treatment_followup_due_reminder'
              ? 'ট্রিটমেন্ট ফলো-আপের দিন আজ'
              : 'ট্রিটমেন্ট ফলো-আপ আসছে',
          body: `${treatment.medicine.nameBn} — ফলো-আপ তারিখ: ${treatment.nextFollowUpDate?.toDateString()}`,
          data: { treatmentId: treatment.id, projectId: treatment.projectId },
        },
        { actionKey },
      );

      await this.prisma.treatment.update({
        where: { id: treatment.id },
        data: { [sentAtField]: new Date() },
      });
    }

    if (candidates.length > 0) {
      this.logger.log(`Sent ${candidates.length} ${actionKey} notifications`);
    }
  }
}
