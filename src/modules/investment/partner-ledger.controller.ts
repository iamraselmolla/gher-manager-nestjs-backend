import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { PartnerLedgerService } from './partner-ledger.service';
import { AddInvestmentDto } from './dto/add-investment.dto';
import { AddWithdrawalDto } from './dto/add-withdrawal.dto';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';

@Controller('projects/:projectId/seasons/:seasonId/partners/:partnerId')
@UseGuards(ProjectRolesGuard)
export class PartnerLedgerController {
  constructor(private readonly ledgerService: PartnerLedgerService) {}

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get('ledger-summary')
  ledgerSummary(@Param('projectId') projectId: string, @Param('partnerId') partnerId: string) {
    return this.ledgerService.getLedgerSummary(projectId, partnerId);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get('investments')
  listInvestments(@Param('projectId') projectId: string, @Param('partnerId') partnerId: string) {
    return this.ledgerService.listInvestments(projectId, partnerId);
  }

  @ProjectRoles(ProjectRole.EDITOR)
  @Post('investments')
  addInvestment(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Param('partnerId') partnerId: string,
    @Body() dto: AddInvestmentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.ledgerService.addInvestment(projectId, seasonId, partnerId, dto, user.id);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get('withdrawals')
  listWithdrawals(@Param('projectId') projectId: string, @Param('partnerId') partnerId: string) {
    return this.ledgerService.listWithdrawals(projectId, partnerId);
  }

  /** Mid-season withdrawal (early profit draw) — see spec §5.8. */
  @ProjectRoles(ProjectRole.EDITOR)
  @Post('withdrawals')
  addWithdrawal(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Param('partnerId') partnerId: string,
    @Body() dto: AddWithdrawalDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.ledgerService.addWithdrawal(projectId, seasonId, partnerId, dto, user.id);
  }
}
