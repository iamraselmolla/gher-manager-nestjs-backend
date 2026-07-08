import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FcmService, PushPayload } from './fcm.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fcmService: FcmService,
  ) {}

  async registerDeviceToken(userId: string, token: string, platform?: string) {
    return this.prisma.deviceToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform, lastUsedAt: new Date() },
    });
  }

  async unregisterDeviceToken(token: string) {
    await this.prisma.deviceToken.deleteMany({ where: { token } });
    return { removed: true };
  }

  /** Sends to every device registered to one user, logging each attempt. */
  async sendToUser(
    userId: string,
    payload: PushPayload,
    context?: { projectId?: string; actionKey?: string },
  ): Promise<void> {
    const tokens = await this.prisma.deviceToken.findMany({ where: { userId } });

    if (tokens.length === 0) {
      await this.prisma.notificationLog.create({
        data: {
          projectId: context?.projectId,
          userId,
          title: payload.title,
          body: payload.body,
          data: payload.data,
          actionKey: context?.actionKey,
          success: false,
          errorMessage: 'No registered device tokens',
        },
      });
      return;
    }

    for (const { token } of tokens) {
      const result = await this.fcmService.sendToToken(token, payload);
      await this.prisma.notificationLog.create({
        data: {
          projectId: context?.projectId,
          userId,
          title: payload.title,
          body: payload.body,
          data: payload.data,
          actionKey: context?.actionKey,
          success: result.success,
          errorMessage: result.error,
        },
      });
    }
  }

  /**
   * Sent to ALL active members (Editors + Investors) of a project, per spec
   * §5.11 — "every update in a project is visible to every investor tied to
   * that project, not just the acting editor." `excludeUserId` optionally
   * skips notifying the person who triggered the action themselves.
   */
  async sendToProjectMembers(
    projectId: string,
    payload: PushPayload,
    options?: { excludeUserId?: string; actionKey?: string },
  ): Promise<void> {
    const members = await this.prisma.projectMember.findMany({
      where: {
        projectId,
        isActive: true,
        ...(options?.excludeUserId ? { userId: { not: options.excludeUserId } } : {}),
      },
      select: { userId: true },
    });

    await Promise.all(
      members.map((m) =>
        this.sendToUser(m.userId, payload, { projectId, actionKey: options?.actionKey }),
      ),
    );
  }
}
