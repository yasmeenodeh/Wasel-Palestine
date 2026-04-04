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
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

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
  providers: [ReportsService, RoleHeaderGuard],
  exports: [ReportsService],
})
export class ReportsModule {}
