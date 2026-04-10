import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { AuditLogEntity } from '../../../database/entities/audit-log.entity';
import { IncidentEntity } from '../../../database/entities/incident.entity';
import { IncidentStatusHistoryEntity } from '../../../database/entities/incident-status-history.entity';
import { IncidentStatusEntity } from '../../../database/entities/incident-status.entity';
import { ReportModerationActionEntity } from '../../../database/entities/report-moderation-action.entity';
import { ReportEntity } from '../../../database/entities/report.entity';
import { ReportVoteEntity } from '../../../database/entities/report-vote.entity';
import { ApproveReportDto } from '../dto/approve-report.dto';
import { ConvertReportDto } from '../dto/convert-report.dto';
import { CreateReportDto } from '../dto/create-report.dto';
import { FlagReportAbuseDto } from '../dto/flag-report-abuse.dto';
import { ListReportsDto } from '../dto/list-reports.dto';
import { MergeReportDto } from '../dto/merge-report.dto';
import { RejectReportDto } from '../dto/reject-report.dto';
import { VoteReportDto } from '../dto/vote-report.dto';
import { ReportCredibilityService } from '../domain/report-credibility.service';
import { ReportsQueryRepository } from '../infrastructure/reports-query.repository';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ReportEntity)
    private readonly reportRepository: Repository<ReportEntity>,
    @InjectRepository(ReportVoteEntity)
    private readonly reportVoteRepository: Repository<ReportVoteEntity>,
    @InjectRepository(ReportModerationActionEntity)
    private readonly reportModerationActionRepository: Repository<ReportModerationActionEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
    @InjectRepository(IncidentEntity)
    private readonly incidentRepository: Repository<IncidentEntity>,
    @InjectRepository(IncidentStatusEntity)
    private readonly incidentStatusRepository: Repository<IncidentStatusEntity>,
    @InjectRepository(IncidentStatusHistoryEntity)
    private readonly incidentStatusHistoryRepository: Repository<IncidentStatusHistoryEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly reportsQueryRepository: ReportsQueryRepository,
    private readonly reportCredibilityService: ReportCredibilityService,
  ) {}

  list(query: ListReportsDto) {
    return this.reportsQueryRepository.list(query);
  }

  async findOne(id: string) {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: {
        submittedByUser: true,
        category: true,
        duplicateOfReport: true,
        convertedIncident: true,
      },
    });

    if (!report) {
      throw new NotFoundException(`Report ${id} was not found.`);
    }

    return report;
  }

  async create(dto: CreateReportDto, actorUserId: number) {
    await this.enforceSubmissionRateLimit(actorUserId);
    await this.preventImmediateResubmission(actorUserId, dto);

    const duplicateCandidate = await this.findDuplicateCandidate(dto);
    const report = this.reportRepository.create({
      submittedBy: actorUserId.toString(),
      latitude: dto.latitude.toString(),
      longitude: dto.longitude.toString(),
      categoryId: dto.categoryId.toString(),
      description: dto.description.trim(),
      reportedAt: dto.reportedAt ? new Date(dto.reportedAt) : new Date(),
      status: duplicateCandidate ? 'under_review' : 'pending',
      confidenceScore: '0.00',
      duplicateOfReportId: duplicateCandidate?.id ?? null,
      convertedIncidentId: null,
    });

    const savedReport = await this.reportRepository.save(report);

    await this.writeAuditLog({
      actorUserId,
      actionType: 'create',
      entityType: 'report',
      entityId: savedReport.id,
      description: 'Report submitted',
      metadata: {
        duplicateCandidateId: duplicateCandidate?.id ?? null,
      },
    });

    return this.findOne(savedReport.id);
  }

  async vote(reportId: string, dto: VoteReportDto, actorUserId: number) {
    const report = await this.findOne(reportId);

    if (report.submittedBy === actorUserId.toString()) {
      throw new BadRequestException('You cannot vote on your own report.');
    }

    if (report.status === 'rejected' || report.status === 'converted') {
      throw new BadRequestException('Voting is not allowed for this report status.');
    }

    const existingVote = await this.reportVoteRepository.findOne({
      where: {
        reportId,
        userId: actorUserId.toString(),
      },
    });

    const vote = existingVote
      ? Object.assign(existingVote, { voteType: dto.voteType })
      : this.reportVoteRepository.create({
          reportId,
          userId: actorUserId.toString(),
          voteType: dto.voteType,
        });

    await this.reportVoteRepository.save(vote);
    await this.recalculateConfidenceScore(reportId);

    return {
      report: await this.findOne(reportId),
      votes: await this.getVotes(reportId),
    };
  }

  async getVotes(reportId: string) {
    await this.findOne(reportId);

    const votes = await this.reportVoteRepository.find({
      where: { reportId },
      relations: {
        user: true,
      },
      order: { createdAt: 'DESC' },
    });

    const summary = votes.reduce(
      (acc, vote) => {
        if (vote.voteType === 'confirm') acc.confirm += 1;
        if (vote.voteType === 'deny') acc.deny += 1;
        return acc;
      },
      { confirm: 0, deny: 0 },
    );

    return {
      data: votes,
      summary,
    };
  }

  async getModerationActions(reportId: string) {
    await this.findOne(reportId);

    return this.reportModerationActionRepository.find({
      where: { reportId },
      relations: {
        performedByUser: true,
        targetReport: true,
        targetIncident: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async approve(reportId: string, dto: ApproveReportDto, actorUserId: number) {
    const report = await this.findOne(reportId);
    report.status = 'approved';
    await this.reportRepository.save(report);
    await this.writeModerationAction(reportId, 'approved', actorUserId, dto.actionNote ?? null);
    await this.writeAuditLog({
      actorUserId,
      actionType: 'approve',
      entityType: 'report',
      entityId: reportId,
      description: 'Report approved',
      metadata: null,
    });
    return this.findOne(reportId);
  }

  async reject(reportId: string, dto: RejectReportDto, actorUserId: number) {
    const report = await this.findOne(reportId);
    report.status = 'rejected';
    await this.reportRepository.save(report);
    await this.writeModerationAction(reportId, 'rejected', actorUserId, dto.actionNote ?? null);
    await this.writeAuditLog({
      actorUserId,
      actionType: 'reject',
      entityType: 'report',
      entityId: reportId,
      description: 'Report rejected',
      metadata: null,
    });
    return this.findOne(reportId);
  }

  async flagAbuse(reportId: string, dto: FlagReportAbuseDto, actorUserId: number) {
    const report = await this.findOne(reportId);
    report.status = 'rejected';
    await this.reportRepository.save(report);
    await this.writeModerationAction(reportId, 'flagged_abuse', actorUserId, dto.actionNote ?? null);
    await this.writeAuditLog({
      actorUserId,
      actionType: 'flag_abuse',
      entityType: 'report',
      entityId: reportId,
      description: 'Report flagged as abusive',
      metadata: null,
    });
    return this.findOne(reportId);
  }

  async merge(reportId: string, dto: MergeReportDto, actorUserId: number) {
    if (reportId === dto.targetReportId) {
      throw new BadRequestException('A report cannot be merged into itself.');
    }

    const report = await this.findOne(reportId);
    await this.findOne(dto.targetReportId);

    report.status = 'merged';
    report.duplicateOfReportId = dto.targetReportId;
    await this.reportRepository.save(report);
    await this.writeModerationAction(
      reportId,
      'merged',
      actorUserId,
      dto.actionNote ?? null,
      dto.targetReportId,
      null,
    );
    await this.writeAuditLog({
      actorUserId,
      actionType: 'merge',
      entityType: 'report',
      entityId: reportId,
      description: 'Report merged',
      metadata: {
        targetReportId: dto.targetReportId,
      },
    });
    return this.findOne(reportId);
  }

  async convertToIncident(reportId: string, dto: ConvertReportDto, actorUserId: number) {
    const report = await this.findOne(reportId);

    if (report.status === 'converted') {
      throw new ConflictException('This report has already been converted.');
    }

    const pendingStatus = await this.incidentStatusRepository.findOne({
      where: { name: 'pending' },
    });

    if (!pendingStatus) {
      throw new NotFoundException('Required incident status "pending" was not found.');
    }

    const incident = this.incidentRepository.create({
      title: dto.title,
      description: report.description,
      latitude: report.latitude,
      longitude: report.longitude,
      categoryId: report.categoryId,
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
        changeReason: 'Incident created from report conversion',
      }),
    );

    report.status = 'converted';
    report.convertedIncidentId = savedIncident.id;
    await this.reportRepository.save(report);

    await this.writeModerationAction(
      reportId,
      'converted_to_incident',
      actorUserId,
      dto.actionNote ?? null,
      null,
      savedIncident.id,
    );
    await this.writeAuditLog({
      actorUserId,
      actionType: 'convert_to_incident',
      entityType: 'report',
      entityId: reportId,
      description: 'Report converted to incident',
      metadata: {
        targetIncidentId: savedIncident.id,
      },
    });
    await this.writeAuditLog({
      actorUserId,
      actionType: 'create',
      entityType: 'incident',
      entityId: savedIncident.id,
      description: 'Incident created from report conversion',
      metadata: {
        sourceReportId: reportId,
      },
    });

    return {
      report: await this.findOne(reportId),
      incident: savedIncident,
    };
  }

  private async enforceSubmissionRateLimit(actorUserId: number) {
    const count = await this.reportRepository.count({
      where: {
        submittedBy: actorUserId.toString(),
        reportedAt: Not(IsNull()),
      },
    });

    if (count < 5) {
      return;
    }

    const recentReports = await this.dataSource.query(
      `
        SELECT COUNT(*) AS total
        FROM reports
        WHERE submitted_by = ?
          AND reported_at >= (NOW() - INTERVAL 1 HOUR)
      `,
      [actorUserId],
    );

    if (Number(recentReports[0]?.total ?? 0) >= 5) {
      throw new HttpException('Report submission rate exceeded. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private async preventImmediateResubmission(actorUserId: number, dto: CreateReportDto) {
    const existing = await this.reportRepository.findOne({
      where: {
        submittedBy: actorUserId.toString(),
        categoryId: dto.categoryId.toString(),
        description: dto.description.trim(),
      },
      order: {
        reportedAt: 'DESC',
      },
    });

    if (!existing) {
      return;
    }

    const reportedAt = existing.reportedAt instanceof Date ? existing.reportedAt : new Date(existing.reportedAt);
    const minutesSinceLastSubmission = (Date.now() - reportedAt.getTime()) / 60000;

    if (
      minutesSinceLastSubmission <= 15 &&
      Math.abs(Number(existing.latitude) - dto.latitude) <= 0.001 &&
      Math.abs(Number(existing.longitude) - dto.longitude) <= 0.001
    ) {
      throw new ConflictException('A very similar report was already submitted recently.');
    }
  }

  private findDuplicateCandidate(dto: CreateReportDto) {
    return this.reportRepository
      .findOne({
        where: {
          categoryId: dto.categoryId.toString(),
          status: Not('rejected'),
        },
        order: {
          reportedAt: 'DESC',
        },
      })
      .then((candidate) => {
        if (!candidate) {
          return null;
        }

        return this.reportCredibilityService.isNearDuplicate(
          candidate,
          {
            latitude: dto.latitude,
            longitude: dto.longitude,
          },
          0.01,
          6,
        )
          ? candidate
          : null;
      });
  }

  private async recalculateConfidenceScore(reportId: string) {
    const rows = await this.dataSource.query(
      `
        SELECT
          COALESCE(SUM(CASE WHEN vote_type = 'confirm' THEN 1 ELSE 0 END), 0) AS confirmVotes,
          COALESCE(SUM(CASE WHEN vote_type = 'deny' THEN 1 ELSE 0 END), 0) AS denyVotes
        FROM report_votes
        WHERE report_id = ?
      `,
      [reportId],
    );

    const confirmVotes = Number(rows[0]?.confirmVotes ?? 0);
    const denyVotes = Number(rows[0]?.denyVotes ?? 0);
    const confidenceScore = this.reportCredibilityService.calculateConfidenceScore(
      confirmVotes,
      denyVotes,
    );

    await this.reportRepository.update(reportId, {
      confidenceScore,
    });
  }

  private writeModerationAction(
    reportId: string,
    actionType: 'approved' | 'rejected' | 'merged' | 'flagged_abuse' | 'converted_to_incident',
    actorUserId: number,
    actionNote: string | null,
    targetReportId: string | null = null,
    targetIncidentId: string | null = null,
  ) {
    return this.reportModerationActionRepository.save(
      this.reportModerationActionRepository.create({
        reportId,
        actionType,
        performedBy: actorUserId.toString(),
        targetReportId,
        targetIncidentId,
        actionNote,
      }),
    );
  }

  private writeAuditLog(input: {
    actorUserId: number;
    actionType:
      | 'create'
      | 'update'
      | 'verify'
      | 'close'
      | 'approve'
      | 'reject'
      | 'merge'
      | 'flag_abuse'
      | 'convert_to_incident';
    entityType: string;
    entityId: string;
    description: string;
    metadata: Record<string, unknown> | null;
  }) {
    return this.auditLogRepository.save(
      this.auditLogRepository.create({
        actorUserId: input.actorUserId.toString(),
        actionType: input.actionType,
        entityType: input.entityType,
        entityId: input.entityId,
        description: input.description,
        metadata: input.metadata,
      }),
    );
  }
}
