import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleHeaderGuard } from '../../common/guards/role-header.guard';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';
import { IncidentEntity } from '../../database/entities/incident.entity';
import { IncidentStatusHistoryEntity } from '../../database/entities/incident-status-history.entity';
import { IncidentStatusEntity } from '../../database/entities/incident-status.entity';
import { ReportImageAnalysisEntity } from '../../database/entities/report-image-analysis.entity';
import { ReportImageEntity } from '../../database/entities/report-image.entity';
import { ReportModerationActionEntity } from '../../database/entities/report-moderation-action.entity';
import { ReportEntity } from '../../database/entities/report.entity';
import { ReportVoteEntity } from '../../database/entities/report-vote.entity';
import { ReportsService } from './application/reports.service';
import { ReportsController } from './reports.controller';
import { ReportCredibilityService } from './domain/report-credibility.service';
import { ReportImageVisionService } from './domain/report-image-vision.service';
import { ReportPointsService } from './domain/report-points.service';
import { ReportTrustService } from './domain/report-trust.service';
import { UserPointsLedgerEntity } from '../../database/entities/user-points-ledger.entity';
import { IncidentsModule } from '../incidents/incidents.module';
import { ReportContributorsQueryRepository } from './infrastructure/report-contributors-query.repository';
import { ReportsQueryRepository } from './infrastructure/reports-query.repository';

@Module({
  imports: [
    IncidentsModule,
    TypeOrmModule.forFeature([
      ReportEntity,
      ReportImageEntity,
      ReportImageAnalysisEntity,
      ReportVoteEntity,
      ReportModerationActionEntity,
      UserPointsLedgerEntity,
      AuditLogEntity,
      IncidentEntity,
      IncidentStatusHistoryEntity,
      IncidentStatusEntity,
    ]),
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportsQueryRepository,
    ReportContributorsQueryRepository,
    ReportCredibilityService,
    ReportImageVisionService,
    ReportPointsService,
    ReportTrustService,
    RoleHeaderGuard,
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
