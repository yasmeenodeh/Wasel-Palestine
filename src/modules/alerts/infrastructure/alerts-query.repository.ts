import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PaginationResponseFactory } from '../../../common/application/pagination-response.factory';
import { ListAlertsDto } from '../dto/list-alerts.dto';

@Injectable()
export class AlertsQueryRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async list(query: ListAlertsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const whereParts: string[] = [];
    const params: Array<string | number> = [];

    if (query.userId) {
      whereParts.push('s.user_id = ?');
      params.push(query.userId);
    }

    if (query.status) {
      whereParts.push('a.status = ?');
      params.push(query.status);
    }

    if (query.incidentId) {
      whereParts.push('a.incident_id = ?');
      params.push(query.incidentId);
    }

    const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const data = await this.dataSource.query(
      `
        SELECT
          a.id,
          a.subscription_id AS subscriptionId,
          a.incident_id AS incidentId,
          a.alert_type AS alertType,
          a.status,
          a.payload,
          a.created_at AS createdAt,
          a.sent_at AS sentAt,
          s.user_id AS userId,
          s.geographic_area AS geographicArea,
          s.category_id AS categoryId
        FROM alerts a
        INNER JOIN alert_subscriptions s ON s.id = a.subscription_id
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset],
    );

    const [{ total }] = await this.dataSource.query(
      `
        SELECT COUNT(*) AS total
        FROM alerts a
        INNER JOIN alert_subscriptions s ON s.id = a.subscription_id
        ${whereClause}
      `,
      params,
    );

    return PaginationResponseFactory.create(data, page, limit, Number(total));
  }
}
