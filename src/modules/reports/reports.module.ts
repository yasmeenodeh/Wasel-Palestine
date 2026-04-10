import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleHeaderGuard } from '../../common/guards/role-header.guard';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';
import { IncidentEntity } from '../../database/entities/incident.entity';
import { IncidentStatusHistoryEntity } from '../../database/entities/incident-status-history.entity';
import { IncidentStatusEntity } from '../../database/entities/incident-status.entity';
import { ReportModerationActionEntity } from '../../database/entities/report-moderation-action.entity';
import { ReportEntity } from '../../database/entities/report.entity';
import { ReportVoteEntity } from '../../database/entities/report-vote.entity';
import { ReportsService } from './application/reports.service';
import { ReportsController } from './reports.controller';
import { ReportCredibilityService } from './domain/report-credibility.service';
import { ReportsQueryRepository } from './infrastructure/reports-query.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReportEntity,
      ReportVoteEntity,
      ReportModerationActionEntity,
      AuditLogEntity,
      IncidentEntity,
      IncidentStatusHistoryEntity,
      IncidentStatusEntity,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsQueryRepository, ReportCredibilityService, RoleHeaderGuard],
  exports: [ReportsService],
})
export class ReportsModule {}
