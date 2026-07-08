import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../prisma/prisma.service';
import { SeasonsService } from '../season/season.service';
import { MedicineService } from './medicine.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationService } from '../notification/notification.service';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';

@Injectable()
export class TreatmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seasonsService: SeasonsService,
    private readonly medicineService: MedicineService,
    private readonly activityLogService: ActivityLogService,
    private readonly notificationService: NotificationService,
    private readonly i18n: I18nService,
  ) {}

  async create(
    projectId: string,
    seasonId: string,
    dto: CreateTreatmentDto,
    createdByUserId: string,
  ) {
    await this.seasonsService.assertActive(seasonId);

    const medicineId = dto.medicineId
      ? dto.medicineId
      : (
          await this.medicineService.findOrCreateCustom(
            dto.customMedicineName!,
            dto.customMedicineCategory!,
            createdByUserId,
          )
        ).id;

    const treatment = await this.prisma.treatment.create({
      data: {
        projectId,
        seasonId,
        medicineId,
        treatmentDate: new Date(dto.treatmentDate),
        quantityUsed: dto.quantityUsed,
        unit: dto.unit,
        reason: dto.reason,
        nextFollowUpDate: dto.nextFollowUpDate ? new Date(dto.nextFollowUpDate) : undefined,
        createdByUserId,
      },
    });

    await this.activityLogService.log({
      projectId,
      seasonId,
      actionKey: 'treatment_given',
      entityType: 'Treatment',
      entityId: treatment.id,
      summary: { quantityUsed: dto.quantityUsed, unit: dto.unit },
      actorUserId: createdByUserId,
    });

    const medicine = await this.prisma.medicine.findUnique({ where: { id: medicineId } });
    await this.notificationService.sendToProjectMembers(
      projectId,
      {
        title: 'ট্রিটমেন্ট দেওয়া হয়েছে',
        body: `${medicine?.nameBn ?? ''} — ${dto.quantityUsed} ${dto.unit}`,
        data: { treatmentId: treatment.id, projectId },
      },
      { excludeUserId: createdByUserId, actionKey: 'treatment_given' },
    );

    return treatment;
  }

  /** Full treatment history for the project/report views, most recent first. */
  async findAllForSeason(projectId: string, seasonId: string) {
    return this.prisma.treatment.findMany({
      where: { projectId, seasonId },
      include: { medicine: true },
      orderBy: { treatmentDate: 'desc' },
    });
  }

  async findById(projectId: string, seasonId: string, treatmentId: string) {
    const treatment = await this.prisma.treatment.findFirst({
      where: { id: treatmentId, projectId, seasonId },
      include: { medicine: true },
    });
    if (!treatment) throw new NotFoundException(this.i18n.t('medicine.treatment_not_found'));
    return treatment;
  }

  async update(
    projectId: string,
    seasonId: string,
    treatmentId: string,
    dto: UpdateTreatmentDto,
  ) {
    await this.seasonsService.assertActive(seasonId);
    await this.findById(projectId, seasonId, treatmentId);
    return this.prisma.treatment.update({
      where: { id: treatmentId },
      data: {
        reason: dto.reason,
        nextFollowUpDate: dto.nextFollowUpDate ? new Date(dto.nextFollowUpDate) : undefined,
      },
    });
  }

  /**
   * Upcoming follow-ups for the dashboard, and the query the Notification
   * module (#14) will schedule its 2-days-before + due-date FCM reminders
   * from once it lands.
   */
  async findUpcomingFollowUps(projectId: string, seasonId: string) {
    return this.prisma.treatment.findMany({
      where: {
        projectId,
        seasonId,
        nextFollowUpDate: { gte: new Date() },
      },
      include: { medicine: true },
      orderBy: { nextFollowUpDate: 'asc' },
    });
  }
}
