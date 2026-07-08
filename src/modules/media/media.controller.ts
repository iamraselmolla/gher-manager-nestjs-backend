import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import { createReadStream, existsSync } from 'fs';
import * as path from 'path';
import { MediaService } from './media.service';
import { UploadMediaDto } from './dto/upload-media.dto';
import { AppConfig } from '../../config/app.config';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';

@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Generic authenticated upload — any module (Growth, Water Quality,
   * Treatment, Project gallery) can point its photo/video field at the
   * returned `url`. Optional `linkedEntityType`/`linkedEntityId` form fields
   * tag the upload for traceability/cleanup.
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
    @CurrentUser() user: RequestUser,
  ) {
    if (!file) {
      throw new BadRequestException(this.i18n.t('media.file_required'));
    }
    return this.mediaService.upload(
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        linkedEntityType: dto.linkedEntityType,
        linkedEntityId: dto.linkedEntityId,
      },
      user.id,
    );
  }

  /**
   * Serves files uploaded via the local storage provider. Irrelevant (and
   * unused) when STORAGE_PROVIDER=s3, since those URLs point directly at
   * the bucket instead. Public because the URL itself is the access
   * control here — same trust model as an S3 public-read bucket.
   */
  @Public()
  @Get('files/:key')
  serveLocalFile(@Param('key') key: string, @Res() res: Response) {
    const { localDir } = this.configService.getOrThrow<AppConfig>('app').storage;
    const filePath = path.join(localDir, key);

    if (!existsSync(filePath)) {
      throw new NotFoundException(this.i18n.t('media.not_found'));
    }
    createReadStream(filePath).pipe(res);
  }
}
