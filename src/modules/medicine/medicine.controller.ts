import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { MedicineCategory, PlatformRole } from '@prisma/client';
import { MedicineService } from './medicine.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';

@Controller('medicines')
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  @Get()
  findAll(@Query('category') category?: MedicineCategory) {
    return this.medicineService.findAll(category);
  }

  @UseGuards(PlatformRolesGuard)
  @Roles(PlatformRole.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateMedicineDto) {
    return this.medicineService.create(dto);
  }
}
