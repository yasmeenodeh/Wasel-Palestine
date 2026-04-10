import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationResponseFactory } from '../../../common/application/pagination-response.factory';
import { AuditLogEntity } from '../../../database/entities/audit-log.entity';
import { ListAuditLogsDto } from '../dto/list-audit-logs.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  async list(query: ListAuditLogsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const sortBy = ['createdAt', 'actionType', 'entityType', 'entityId'].includes(query.sortBy ?? '')
      ? (query.sortBy as keyof AuditLogEntity)
      : 'createdAt';
    const sortOrder = (query.sortOrder ?? 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const qb = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.actorUser', 'actorUser');

    if (query.actorUserId) {
      qb.andWhere('auditLog.actor_user_id = :actorUserId', { actorUserId: query.actorUserId });
    }

    if (query.actionType) {
      qb.andWhere('auditLog.action_type = :actionType', { actionType: query.actionType });
    }

    if (query.entityType) {
      qb.andWhere('auditLog.entity_type = :entityType', { entityType: query.entityType });
    }

    if (query.entityId) {
      qb.andWhere('auditLog.entity_id = :entityId', { entityId: query.entityId });
    }

    const [data, total] = await qb
      .orderBy(`auditLog.${sortBy}`, sortOrder)
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return PaginationResponseFactory.create(data, page, limit, total);
  }
}
