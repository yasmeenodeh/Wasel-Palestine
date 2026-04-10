import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PaginationResponseFactory } from '../../../common/application/pagination-response.factory';
import { ListIncidentsDto } from '../dto/list-incidents.dto';

@Injectable()
export class IncidentsQueryRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

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

    const data = await this.dataSource.query(
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

    return PaginationResponseFactory.create(data, page, limit, Number(total));
  }
}
