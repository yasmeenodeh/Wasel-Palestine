import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidentEntity } from '../../../database/entities/incident.entity';
import { IncidentStatusHistoryEntity } from '../../../database/entities/incident-status-history.entity';
import { AlertsService } from '../../alerts/application/alerts.service';
import { CloseIncidentDto } from '../dto/close-incident.dto';
import { CreateIncidentDto } from '../dto/create-incident.dto';
import { ListIncidentsDto } from '../dto/list-incidents.dto';
import { UpdateIncidentDto } from '../dto/update-incident.dto';
import { VerifyIncidentDto } from '../dto/verify-incident.dto';
import { IncidentStatusService } from '../domain/incident-status.service';
import { IncidentsQueryRepository } from '../infrastructure/incidents-query.repository';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(IncidentEntity)
    private readonly incidentRepository: Repository<IncidentEntity>,
    @InjectRepository(IncidentStatusHistoryEntity)
    private readonly incidentStatusHistoryRepository: Repository<IncidentStatusHistoryEntity>,
    private readonly incidentsQueryRepository: IncidentsQueryRepository,
    private readonly incidentStatusService: IncidentStatusService,
    private readonly alertsService: AlertsService,
  ) {}

  list(query: ListIncidentsDto) {
    return this.incidentsQueryRepository.list(query);
  }

  async findOne(id: string) {
    const incident = await this.incidentRepository.findOne({
      where: { id },
      relations: {
        category: true,
        severity: true,
        status: true,
        checkpoint: true,
        createdByUser: true,
        verifiedByUser: true,
        closedByUser: true,
      },
    });

    if (!incident) {
      throw new NotFoundException(`Incident ${id} was not found.`);
    }

    return incident;
  }

  async create(dto: CreateIncidentDto, actorUserId: number) {
    const pendingStatus = await this.incidentStatusService.findByName('pending');
    const incident = this.incidentRepository.create({
      title: dto.title,
      description: dto.description,
      latitude: dto.latitude.toString(),
      longitude: dto.longitude.toString(),
      categoryId: dto.categoryId.toString(),
      severityId: dto.severityId.toString(),
      statusId: pendingStatus.id,
      checkpointId: dto.checkpointId ? dto.checkpointId.toString() : null,
      createdBy: actorUserId.toString(),
      verifiedBy: null,
      closedBy: null,
      verifiedAt: null,
      closedAt: null,
    });

    const savedIncident = await this.incidentRepository.save(incident);
    await this.writeStatusHistory(savedIncident.id, null, pendingStatus.id, actorUserId, 'Incident created');
    return this.findOne(savedIncident.id);
  }

  async update(id: string, dto: UpdateIncidentDto) {
    const incident = await this.findOne(id);

    if (dto.title !== undefined) incident.title = dto.title;
    if (dto.description !== undefined) incident.description = dto.description;
    if (dto.latitude !== undefined) incident.latitude = dto.latitude.toString();
    if (dto.longitude !== undefined) incident.longitude = dto.longitude.toString();
    if (dto.categoryId !== undefined) incident.categoryId = dto.categoryId.toString();
    if (dto.severityId !== undefined) incident.severityId = dto.severityId.toString();
    if (dto.checkpointId !== undefined) {
      incident.checkpointId = dto.checkpointId ? dto.checkpointId.toString() : null;
    }

    await this.incidentRepository.save(incident);
    return this.findOne(id);
  }

  async verify(id: string, dto: VerifyIncidentDto, actorUserId: number) {
    const incident = await this.findOne(id);
    const verifiedStatus = await this.incidentStatusService.findByName('verified');
    const fromStatusId = incident.statusId;

    incident.statusId = verifiedStatus.id;
    incident.verifiedBy = actorUserId.toString();
    incident.verifiedAt = new Date();

    await this.incidentRepository.save(incident);
    await this.writeStatusHistory(
      incident.id,
      fromStatusId,
      verifiedStatus.id,
      actorUserId,
      dto.changeReason ?? 'Incident verified',
    );
    await this.alertsService.createAlertsForVerifiedIncident(incident.id);

    return this.findOne(id);
  }

  async close(id: string, dto: CloseIncidentDto, actorUserId: number) {
    const incident = await this.findOne(id);
    const closedStatus = await this.incidentStatusService.findByName('closed');
    const fromStatusId = incident.statusId;

    incident.statusId = closedStatus.id;
    incident.closedBy = actorUserId.toString();
    incident.closedAt = new Date();

    await this.incidentRepository.save(incident);
    await this.writeStatusHistory(
      incident.id,
      fromStatusId,
      closedStatus.id,
      actorUserId,
      dto.changeReason ?? 'Incident closed',
    );

    return this.findOne(id);
  }

  async getStatusHistory(incidentId: string) {
    await this.findOne(incidentId);

    return this.incidentStatusHistoryRepository.find({
      where: { incidentId },
      relations: {
        fromStatus: true,
        toStatus: true,
        changedByUser: true,
      },
      order: { changedAt: 'DESC' },
    });
  }

  private writeStatusHistory(
    incidentId: string,
    fromStatusId: string | null,
    toStatusId: string,
    actorUserId: number,
    changeReason: string,
  ) {
    return this.incidentStatusHistoryRepository.save(
      this.incidentStatusHistoryRepository.create({
        incidentId,
        fromStatusId,
        toStatusId,
        changedBy: actorUserId.toString(),
        changeReason,
      }),
    );
  }
}
