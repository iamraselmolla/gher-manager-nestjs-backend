import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../config/app.config';
import { StorageProvider, UploadedFileResult } from './storage-provider.interface';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';

@Injectable()
export class StorageService implements StorageProvider {
  private readonly provider: StorageProvider;

  constructor(
    configService: ConfigService,
    localProvider: LocalStorageProvider,
    s3Provider: S3StorageProvider,
  ) {
    const { provider } = configService.getOrThrow<AppConfig>('app').storage;
    this.provider = provider === 's3' ? s3Provider : localProvider;
  }

  upload(buffer: Buffer, originalName: string, mimeType: string): Promise<UploadedFileResult> {
    return this.provider.upload(buffer, originalName, mimeType);
  }
}
