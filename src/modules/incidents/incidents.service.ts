import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { IncidentEntity } from '../../database/entities/incident.entity';
import { IncidentStatusHistoryEntity } from '../../database/entities/incident-status-history.entity';
import { IncidentStatusEntity } from '../../database/entities/incident-status.entity';
import { CloseIncidentDto } from './dto/close-incident.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { ListIncidentsDto } from './dto/list-incidents.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { VerifyIncidentDto } from './dto/verify-incident.dto';

type StatusSeedName = 'pending' | 'verified' | 'closed';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(IncidentEntity)
    private readonly incidentRepository: Repository<IncidentEntity>,
    @InjectRepository(IncidentStatusEntity)
    private readonly incidentStatusRepository: Repository<IncidentStatusEntity>,
    @InjectRepository(IncidentStatusHistoryEntity)
    private readonly incidentStatusHistoryRepository: Repository<IncidentStatusHistoryEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async list(query: ListIncidentsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const sortFieldMap: Record<string, string> = {
      createdAt: 'i.created_at',
      updatedAt: 'i.updated_at',
      closedAt: 'i.closed_at',
      verifiedAt: 'i.verified_at',
      severityId: 'i.severity_id',
      statusId: 'i.status_id',
    };
    const sortBy = sortFieldMap[query.sortBy ?? ''] ?? 'i.updated_at';
    const sortOrder = (query.sortOrder ?? 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const whereParts: string[] = [];
    const params: Array<string | number> = [];

    if (query.categoryId) {
      whereParts.push('i.category_id = ?');
      params.push(query.categoryId);
    }

    if (query.severityId) {
      whereParts.push('i.severity_id = ?');
      params.push(query.severityId);
    }

    if (query.statusId) {
      whereParts.push('i.status_id = ?');
      params.push(query.statusId);
    }

    if (query.checkpointId) {
      whereParts.push('i.checkpoint_id = ?');
      params.push(query.checkpointId);
    }

    if (query.createdBy) {
      whereParts.push('i.created_by = ?');
      params.push(query.createdBy);
    }

    if (query.search) {
      whereParts.push('(i.title LIKE ? OR i.description LIKE ?)');
      params.push(`%${query.search}%`, `%${query.search}%`);
    }

    const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const rows = await this.dataSource.query(
      `
        SELECT
          i.id,
          i.title,
          i.description,
          i.latitude,
          i.longitude,
          i.category_id AS categoryId,
          category.name AS categoryName,
          i.severity_id AS severityId,
          severity.name AS severityName,
          i.status_id AS statusId,
          status.name AS statusName,
          i.checkpoint_id AS checkpointId,
          checkpoint.name AS checkpointName,
          i.created_by AS createdBy,
          i.verified_by AS verifiedBy,
          i.closed_by AS closedBy,
          i.created_at AS createdAt,
          i.verified_at AS verifiedAt,
          i.closed_at AS closedAt,
          i.updated_at AS updatedAt
        FROM incidents i
        INNER JOIN incident_categories category ON category.id = i.category_id
        INNER JOIN incident_severities severity ON severity.id = i.severity_id
        INNER JOIN incident_statuses status ON status.id = i.status_id
        LEFT JOIN checkpoints checkpoint ON checkpoint.id = i.checkpoint_id
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset],
    );

    const [{ total }] = await this.dataSource.query(
      `
        SELECT COUNT(*) AS total
        FROM incidents i
        ${whereClause}
      `,
      params,
    );

    return {
      data: rows,
      meta: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
    };
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
    const pendingStatus = await this.findStatusByName('pending');

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

    await this.incidentStatusHistoryRepository.save(
      this.incidentStatusHistoryRepository.create({
        incidentId: savedIncident.id,
        fromStatusId: null,
        toStatusId: pendingStatus.id,
        changedBy: actorUserId.toString(),
        changeReason: 'Incident created',
      }),
    );

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
    const verifiedStatus = await this.findStatusByName('verified');
    const fromStatusId = incident.statusId;

    incident.statusId = verifiedStatus.id;
    incident.verifiedBy = actorUserId.toString();
    incident.verifiedAt = new Date();

    await this.incidentRepository.save(incident);
    await this.incidentStatusHistoryRepository.save(
      this.incidentStatusHistoryRepository.create({
        incidentId: incident.id,
        fromStatusId,
        toStatusId: verifiedStatus.id,
        changedBy: actorUserId.toString(),
        changeReason: dto.changeReason ?? 'Incident verified',
      }),
    );

    return this.findOne(id);
  }

  async close(id: string, dto: CloseIncidentDto, actorUserId: number) {
    const incident = await this.findOne(id);
    const closedStatus = await this.findStatusByName('closed');
    const fromStatusId = incident.statusId;

    incident.statusId = closedStatus.id;
    incident.closedBy = actorUserId.toString();
    incident.closedAt = new Date();

    await this.incidentRepository.save(incident);
    await this.incidentStatusHistoryRepository.save(
      this.incidentStatusHistoryRepository.create({
        incidentId: incident.id,
        fromStatusId,
        toStatusId: closedStatus.id,
        changedBy: actorUserId.toString(),
        changeReason: dto.changeReason ?? 'Incident closed',
      }),
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

  private async findStatusByName(name: StatusSeedName) {
    const status = await this.incidentStatusRepository.findOne({
      where: { name },
    });

    if (!status) {
      throw new NotFoundException(`Required incident status "${name}" was not found in seed data.`);
    }

    return status;
  }
}
