import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from './storage/storage.service';

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB — farm photos/short videos
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
];

export interface UploadFileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  linkedEntityType?: string;
  linkedEntityId?: string;
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly i18n: I18nService,
  ) {}

  private assertValid(input: UploadFileInput) {
    if (input.sizeBytes > MAX_SIZE_BYTES) {
      throw new BadRequestException(
        this.i18n.t('media.file_too_large', { args: { maxMb: MAX_SIZE_BYTES / (1024 * 1024) } }),
      );
    }
    if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
      throw new BadRequestException(this.i18n.t('media.invalid_file_type'));
    }
  }

  async upload(input: UploadFileInput, uploadedByUserId: string) {
    this.assertValid(input);

    const { url } = await this.storageService.upload(
      input.buffer,
      input.originalName,
      input.mimeType,
    );

    return this.prisma.mediaAsset.create({
      data: {
        url,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        linkedEntityType: input.linkedEntityType,
        linkedEntityId: input.linkedEntityId,
        uploadedByUserId,
      },
    });
  }

  async findByLinkedEntity(entityType: string, entityId: string) {
    return this.prisma.mediaAsset.findMany({
      where: { linkedEntityType: entityType, linkedEntityId: entityId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findById(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException(this.i18n.t('media.not_found'));
    return asset;
  }
}
