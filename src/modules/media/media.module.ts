import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { StorageService } from './storage/storage.service';
import { LocalStorageProvider } from './storage/local-storage.provider';
import { S3StorageProvider } from './storage/s3-storage.provider';

@Module({
  controllers: [MediaController],
  providers: [MediaService, StorageService, LocalStorageProvider, S3StorageProvider],
  exports: [MediaService],
})
export class MediaModule {}
