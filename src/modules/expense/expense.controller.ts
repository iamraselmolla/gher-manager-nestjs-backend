import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ExpenseCategory, ProjectRole } from '@prisma/client';
import { ExpenseService, TimelineGranularity } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';

@Controller('projects/:projectId/seasons/:seasonId/expenses')
@UseGuards(ProjectRolesGuard)
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @ProjectRoles(ProjectRole.EDITOR)
  @Post()
  create(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Body() dto: CreateExpenseDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.expenseService.create(projectId, seasonId, dto, user.id);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Query('category') category?: ExpenseCategory,
  ) {
    return this.expenseService.findAllForSeason(projectId, seasonId, category);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get('breakdown/category')
  categoryBreakdown(@Param('projectId') projectId: string, @Param('seasonId') seasonId: string) {
    return this.expenseService.categoryBreakdown(projectId, seasonId);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get('breakdown/timeline')
  timelineBreakdown(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Query('granularity') granularity: TimelineGranularity = 'month',
  ) {
    return this.expenseService.timelineBreakdown(projectId, seasonId, granularity);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get(':expenseId')
  findOne(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Param('expenseId') expenseId: string,
  ) {
    return this.expenseService.findById(projectId, seasonId, expenseId);
  }

  @ProjectRoles(ProjectRole.EDITOR)
  @Patch(':expenseId')
  update(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Param('expenseId') expenseId: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expenseService.update(projectId, seasonId, expenseId, dto);
  }
}
