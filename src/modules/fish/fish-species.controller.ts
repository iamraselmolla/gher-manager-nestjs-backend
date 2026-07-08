import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { FishCategory, PlatformRole } from '@prisma/client';
import { FishSpeciesService } from './fish-species.service';
import { CreateFishSpeciesDto } from './dto/create-fish-species.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';

@Controller('fish-species')
export class FishSpeciesController {
  constructor(private readonly speciesService: FishSpeciesService) {}

  /** Any authenticated user can browse the catalog (needed to populate stocking-form dropdowns). */
  @Get()
  findAll(@Query('category') category?: FishCategory) {
    return this.speciesService.findAll(category);
  }

  @UseGuards(PlatformRolesGuard)
  @Roles(PlatformRole.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateFishSpeciesDto) {
    return this.speciesService.create(dto);
  }
}
