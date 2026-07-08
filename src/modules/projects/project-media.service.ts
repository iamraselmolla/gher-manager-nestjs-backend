import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { MediaType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectMediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async list(projectId: string) {
    return this.prisma.projectMedia.findMany({
      where: { projectId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async add(
    projectId: string,
    input: { url: string; type: MediaType; caption?: string },
    uploadedByUserId: string,
  ) {
    return this.prisma.projectMedia.create({
      data: { projectId, ...input, uploadedByUserId },
    });
  }

  async remove(projectId: string, mediaId: string) {
    const media = await this.prisma.projectMedia.findFirst({
      where: { id: mediaId, projectId },
    });
    if (!media) {
      throw new NotFoundException(this.i18n.t('common.errors.not_found'));
    }
    await this.prisma.projectMedia.delete({ where: { id: mediaId } });
    return { removed: true };
  }
}
