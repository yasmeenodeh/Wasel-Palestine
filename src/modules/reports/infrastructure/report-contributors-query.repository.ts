import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ReportContributorsQueryRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  listTopContributors(limit: number) {
    return this.dataSource.query(
      `
        SELECT
          u.id,
          u.full_name AS fullName,
          u.username,
          u.email,
          COALESCE(SUM(l.points), 0) AS totalPoints,
          COALESCE(SUM(CASE WHEN l.action_type = 'report_approved' THEN l.points ELSE 0 END), 0) AS approvedPoints,
          COALESCE(SUM(CASE WHEN l.action_type = 'report_converted' THEN l.points ELSE 0 END), 0) AS convertedPoints,
          COALESCE(SUM(CASE WHEN l.action_type = 'trusted_report_bonus' THEN l.points ELSE 0 END), 0) AS trustBonusPoints,
          COUNT(l.id) AS totalAwards
        FROM user_points_ledger l
        INNER JOIN users u ON u.id = l.user_id
        GROUP BY u.id, u.full_name, u.username, u.email
        ORDER BY totalPoints DESC, totalAwards DESC, u.id ASC
        LIMIT ?
      `,
      [limit],
    );
  }
}
