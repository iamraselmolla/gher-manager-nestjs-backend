import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';

@Controller('projects/:projectId/seasons/:seasonId/sales')
@UseGuards(ProjectRolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @ProjectRoles(ProjectRole.EDITOR)
  @Post()
  create(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Body() dto: CreateSaleDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.salesService.create(projectId, seasonId, dto, user.id);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get()
  findAll(@Param('projectId') projectId: string, @Param('seasonId') seasonId: string) {
    return this.salesService.findAllForSeason(projectId, seasonId);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get('total-net')
  totalNet(@Param('projectId') projectId: string, @Param('seasonId') seasonId: string) {
    return this.salesService.totalNetSales(projectId, seasonId);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get(':saleId')
  findOne(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Param('saleId') saleId: string,
  ) {
    return this.salesService.findById(projectId, seasonId, saleId);
  }

  @ProjectRoles(ProjectRole.EDITOR)
  @Patch(':saleId')
  update(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Param('saleId') saleId: string,
    @Body() dto: UpdateSaleDto,
  ) {
    return this.salesService.update(projectId, seasonId, saleId, dto);
  }
}
