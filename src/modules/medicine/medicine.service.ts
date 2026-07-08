import { Injectable } from '@nestjs/common';
import { MedicineCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';

@Injectable()
export class MedicineService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: MedicineCategory) {
    return this.prisma.medicine.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: 'asc' }, { nameEn: 'asc' }],
    });
  }

  async create(dto: CreateMedicineDto) {
    return this.prisma.medicine.create({ data: { ...dto, isCustom: false } });
  }

  async findOrCreateCustom(
    name: string,
    category: MedicineCategory,
    createdByUserId: string,
  ) {
    const existing = await this.prisma.medicine.findFirst({ where: { nameEn: name } });
    if (existing) return existing;

    return this.prisma.medicine.create({
      data: { category, nameBn: name, nameEn: name, isCustom: true, createdByUserId },
    });
  }
}
