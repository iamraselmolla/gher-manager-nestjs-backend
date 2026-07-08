import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ProjectRole } from '@prisma/client';
import { ReportService, ReportType } from './report.service';
import { ProjectRoles } from '../../common/decorators/project-roles.decorator';
import { ProjectRolesGuard } from '../../common/guards/project-roles.guard';

@Controller('projects/:projectId/seasons/:seasonId/reports')
@UseGuards(ProjectRolesGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get(':type')
  getReport(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Param('type') type: ReportType,
  ) {
    return this.reportService.getReportJson(type, projectId, seasonId);
  }

  @ProjectRoles(ProjectRole.EDITOR, ProjectRole.INVESTOR)
  @Get(':type/pdf')
  async getReportPdf(
    @Param('projectId') projectId: string,
    @Param('seasonId') seasonId: string,
    @Param('type') type: ReportType,
    @Res() res: Response,
  ) {
    const buffer = await this.reportService.getReportPdf(type, projectId, seasonId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${type}-report-${seasonId}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }
}
