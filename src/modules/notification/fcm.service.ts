import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { AppConfig } from '../../config/app.config';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Thin wrapper over firebase-admin. If FCM_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY
 * aren't set (e.g. local dev without real Firebase credentials), this
 * degrades to a no-op that logs instead of throwing — the rest of the
 * notification pipeline (device token registry, BullMQ reminder scanning,
 * NotificationLog history) still works and is fully testable; only actual
 * delivery to a real device requires real credentials.
 */
@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private app: admin.app.App | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const { fcm } = this.configService.getOrThrow<AppConfig>('app');
    if (!fcm.projectId || !fcm.clientEmail || !fcm.privateKey) {
      this.logger.warn(
        'FCM credentials not configured (FCM_PROJECT_ID/FCM_CLIENT_EMAIL/FCM_PRIVATE_KEY) — push notifications will be logged only, not delivered.',
      );
      return;
    }
    this.app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: fcm.projectId,
        clientEmail: fcm.clientEmail,
        privateKey: fcm.privateKey,
      }),
    });
    this.logger.log('Firebase Admin initialized for FCM push notifications');
  }

  get isConfigured(): boolean {
    return this.app !== null;
  }

  /** Sends to one device token. Returns whether delivery succeeded (or was skipped because FCM isn't configured). */
  async sendToToken(
    token: string,
    payload: PushPayload,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.app) {
      this.logger.debug(`[FCM disabled] would send to ${token}: ${payload.title}`);
      return { success: false, error: 'FCM not configured' };
    }
    try {
      await admin.messaging(this.app).send({
        token,
        notification: { title: payload.title, body: payload.body },
        data: payload.data,
      });
      return { success: true };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.warn(`FCM send failed for token ${token}: ${message}`);
      return { success: false, error: message };
    }
  }
}
