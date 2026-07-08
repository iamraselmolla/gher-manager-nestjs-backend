import { Injectable } from '@nestjs/common';
import { FishCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFishSpeciesDto } from './dto/create-fish-species.dto';

@Injectable()
export class FishSpeciesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: FishCategory) {
    return this.prisma.fishSpecies.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: 'asc' }, { nameEn: 'asc' }],
    });
  }

  /** Admin catalog management — adding a species this way is never "custom". */
  async create(dto: CreateFishSpeciesDto) {
    return this.prisma.fishSpecies.create({ data: { ...dto, isCustom: false } });
  }

  /**
   * Used internally by FishBatchService when a caller stocks a species that
   * isn't in the catalog yet — creates it inline, flagged `isCustom: true`.
   */
  async findOrCreateCustom(
    name: string,
    category: FishCategory,
    createdByUserId: string,
  ) {
    const existing = await this.prisma.fishSpecies.findFirst({
      where: { nameEn: name },
    });
    if (existing) return existing;

    return this.prisma.fishSpecies.create({
      data: {
        category,
        nameBn: name,
        nameEn: name,
        isCustom: true,
        createdByUserId,
      },
    });
  }
}
