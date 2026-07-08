import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface LogActivityInput {
  projectId: string;
  seasonId?: string;
  actionKey: string;
  entityType: string;
  entityId: string;
  summary?: Record<string, unknown>;
  actorUserId: string;
}

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fire-and-verify: every write-path across the platform calls this after
   * its own operation succeeds. Failures here are logged but never thrown —
   * an audit-trail hiccup must not roll back or block the real operation
   * that already succeeded.
   */
  async log(input: LogActivityInput): Promise<void> {
    try {
      await this.prisma.activityLog.create({
        data: {
          projectId: input.projectId,
          seasonId: input.seasonId,
          actionKey: input.actionKey,
          entityType: input.entityType,
          entityId: input.entityId,
          summary: (input.summary ?? undefined) as Prisma.InputJsonValue,
          actorUserId: input.actorUserId,
        },
      });
    } catch (err) {
      this.logger.warn(
        `Failed to write activity log (${input.actionKey} on ${input.entityType}:${input.entityId}): ${(err as Error).message}`,
      );
    }
  }

  async findAllForProject(
    projectId: string,
    params: { seasonId?: string; limit?: number },
  ) {
    return this.prisma.activityLog.findMany({
      where: { projectId, seasonId: params.seasonId },
      include: { actor: { select: { id: true, name: true, mobileNumber: true } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(params.limit ?? 50, 1), 200),
    });
  }
}
