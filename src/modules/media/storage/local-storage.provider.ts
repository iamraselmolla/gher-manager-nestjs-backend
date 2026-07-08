import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { AppConfig } from '../../../config/app.config';
import { StorageProvider, UploadedFileResult } from './storage-provider.interface';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly configService: ConfigService) {}

  async upload(buffer: Buffer, originalName: string, _mimeType: string): Promise<UploadedFileResult> {
    const { localDir, localPublicBaseUrl } = this.configService.getOrThrow<AppConfig>('app').storage;
    const key = `${Date.now()}-${randomBytes(6).toString('hex')}${path.extname(originalName)}`;

    await fs.mkdir(localDir, { recursive: true });
    await fs.writeFile(path.join(localDir, key), buffer);

    return { url: `${localPublicBaseUrl}/${key}`, key };
  }
}
