import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PaginationResponseFactory } from '../../../common/application/pagination-response.factory';
import { ListReportsDto } from '../dto/list-reports.dto';

@Injectable()
export class ReportsQueryRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async list(query: ListReportsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const sortFieldMap: Record<string, string> = {
      reportedAt: 'r.reported_at',
      confidenceScore: 'r.confidence_score',
      status: 'r.status',
    };
    const sortBy = sortFieldMap[query.sortBy ?? ''] ?? 'r.reported_at';
    const sortOrder = (query.sortOrder ?? 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const whereParts: string[] = [];
    const params: Array<string | number> = [];

    if (query.status) {
      whereParts.push('r.status = ?');
      params.push(query.status);
    }

    if (query.categoryId) {
      whereParts.push('r.category_id = ?');
      params.push(query.categoryId);
    }

    if (query.submittedBy) {
      whereParts.push('r.submitted_by = ?');
      params.push(query.submittedBy);
    }

    if (query.hasDuplicate === 'true') {
      whereParts.push('r.duplicate_of_report_id IS NOT NULL');
    }

    if (query.hasDuplicate === 'false') {
      whereParts.push('r.duplicate_of_report_id IS NULL');
    }

    if (query.search) {
      whereParts.push('r.description LIKE ?');
      params.push(`%${query.search}%`);
    }

    const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const data = await this.dataSource.query(
      `
        SELECT
          r.id,
          r.submitted_by AS submittedBy,
          r.latitude,
          r.longitude,
          r.category_id AS categoryId,
          c.name AS categoryName,
          r.description,
          r.reported_at AS reportedAt,
          r.status,
          r.confidence_score AS confidenceScore,
          r.duplicate_of_report_id AS duplicateOfReportId,
          r.converted_incident_id AS convertedIncidentId,
          COALESCE(SUM(CASE WHEN rv.vote_type = 'confirm' THEN 1 ELSE 0 END), 0) AS confirmVotes,
          COALESCE(SUM(CASE WHEN rv.vote_type = 'deny' THEN 1 ELSE 0 END), 0) AS denyVotes
        FROM reports r
        INNER JOIN incident_categories c ON c.id = r.category_id
        LEFT JOIN report_votes rv ON rv.report_id = r.id
        ${whereClause}
        GROUP BY
          r.id, r.submitted_by, r.latitude, r.longitude, r.category_id, c.name, r.description,
          r.reported_at, r.status, r.confidence_score, r.duplicate_of_report_id, r.converted_incident_id
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset],
    );

    const [{ total }] = await this.dataSource.query(
      `
        SELECT COUNT(*) AS total
        FROM reports r
        ${whereClause}
      `,
      params,
    );

    return PaginationResponseFactory.create(data, page, limit, Number(total));
  }
}
