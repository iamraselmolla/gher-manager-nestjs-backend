import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { VendorService } from './vendor.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { AddVendorLedgerPaymentDto } from './dto/add-vendor-ledger-payment.dto';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/authenticated-request.interface';

@Controller('projects/:projectId/vendors')
@UseGuards(ProjectRolesGuard)
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @ProjectRoles(ProjectRole.EDITOR)
  @Post()
  create(@Param('projectId') projectId: string, @Body() dto: CreateVendorDto) {
    return this.vendorService.create(projectId, dto);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.vendorService.findAll(projectId);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get(':vendorId/ledger-summary')
  ledgerSummary(@Param('projectId') projectId: string, @Param('vendorId') vendorId: string) {
    return this.vendorService.getLedgerSummary(projectId, vendorId);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get(':vendorId/ledger-payments')
  listLedgerPayments(@Param('projectId') projectId: string, @Param('vendorId') vendorId: string) {
    return this.vendorService.listLedgerPayments(projectId, vendorId);
  }

  /** The "বাকি পরিশোধ" due-clearance payment — independent of any new stock purchase. */
  @ProjectRoles(ProjectRole.EDITOR)
  @Post(':vendorId/ledger-payments')
  addLedgerPayment(
    @Param('projectId') projectId: string,
    @Param('vendorId') vendorId: string,
    @Body() dto: AddVendorLedgerPaymentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.vendorService.addLedgerPayment(projectId, vendorId, dto, user.id);
  }
}
