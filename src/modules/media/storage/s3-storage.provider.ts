import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';
import * as path from 'path';
import { AppConfig } from '../../../config/app.config';
import { StorageProvider, UploadedFileResult } from './storage-provider.interface';

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly endpoint?: string;

  constructor(private readonly configService: ConfigService) {
    const { region, endpoint, accessKey, secretKey, bucket } =
      this.configService.getOrThrow<AppConfig>('app').storage;
    this.bucket = bucket;
    this.endpoint = endpoint;
    this.client = new S3Client({
      region,
      endpoint, // Supabase Storage's S3-compatible endpoint, or any other S3-compatible provider
      forcePathStyle: true, // required by most non-AWS S3-compatible services, incl. Supabase
      credentials:
        accessKey && secretKey ? { accessKeyId: accessKey, secretAccessKey: secretKey } : undefined,
    });
  }

  async upload(buffer: Buffer, originalName: string, mimeType: string): Promise<UploadedFileResult> {
    const key = `${Date.now()}-${randomBytes(6).toString('hex')}${path.extname(originalName)}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    const url = this.endpoint
      ? `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`
      : `https://${this.bucket}.s3.amazonaws.com/${key}`;

    return { url, key };
  }
}
