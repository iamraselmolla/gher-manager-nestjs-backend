import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';

const JOB_ID = 'scan-follow-ups-daily';

@Injectable()
export class ReminderSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(ReminderSchedulerService.name);

  constructor(@InjectQueue('reminders') private readonly remindersQueue: Queue) {}

  async onModuleInit() {
    // Repeatable jobs are keyed by (name + repeat options); BullMQ dedupes
    // automatically on restart, but we still remove-then-add by our own
    // fixed jobId so a changed cron expression takes effect immediately
    // rather than leaving a stale schedule running alongside a new one.
    const existing = await this.remindersQueue.getRepeatableJobs();
    for (const job of existing) {
      if (job.id === JOB_ID) {
        await this.remindersQueue.removeRepeatableByKey(job.key);
      }
    }

    await this.remindersQueue.add(
      'scan-follow-ups',
      {},
      {
        jobId: JOB_ID,
        repeat: { pattern: '0 8 * * *' }, // every day at 08:00 server time
      },
    );

    this.logger.log('Scheduled daily treatment follow-up reminder scan (08:00)');
  }
}
