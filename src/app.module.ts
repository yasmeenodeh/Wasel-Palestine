import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertSubscriptionEntity } from './database/entities/alert-subscription.entity';
import { AlertEntity } from './database/entities/alert.entity';
import { AuditLogEntity } from './database/entities/audit-log.entity';
import { CheckpointStatusHistoryEntity } from './database/entities/checkpoint-status-history.entity';
import { CheckpointEntity } from './database/entities/checkpoint.entity';
import { EmergencyServiceCenterEntity } from './database/entities/emergency-service-center.entity';
import { ExternalApiCacheEntity } from './database/entities/external-api-cache.entity';
import { ExternalApiRequestLogEntity } from './database/entities/external-api-request-log.entity';
import { IncidentCategoryEntity } from './database/entities/incident-category.entity';
import { IncidentEmergencyDispatchEntity } from './database/entities/incident-emergency-dispatch.entity';
import { IncidentEntity } from './database/entities/incident.entity';
import { IncidentSeverityEntity } from './database/entities/incident-severity.entity';
import { IncidentStatusHistoryEntity } from './database/entities/incident-status-history.entity';
import { IncidentStatusEntity } from './database/entities/incident-status.entity';
import { ReportImageAnalysisEntity } from './database/entities/report-image-analysis.entity';
import { ReportImageEntity } from './database/entities/report-image.entity';
import { ReportModerationActionEntity } from './database/entities/report-moderation-action.entity';
import { ReportEntity } from './database/entities/report.entity';
import { ReportVoteEntity } from './database/entities/report-vote.entity';
import { RoleEntity } from './database/entities/role.entity';
import { RouteEstimationConstraintEntity } from './database/entities/route-estimation-constraint.entity';
import { RouteEstimationFactorEntity } from './database/entities/route-estimation-factor.entity';
import { RouteEstimationEntity } from './database/entities/route-estimation.entity';
import { UserPointsLedgerEntity } from './database/entities/user-points-ledger.entity';
import { UserEntity } from './database/entities/user.entity';
import { AlertsModule } from './modules/alerts/alerts.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { CheckpointsModule } from './modules/checkpoints/checkpoints.module';
import { ExternalIntelligenceModule } from './modules/external-intelligence/external-intelligence.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { ReferenceDataModule } from './modules/reference-data/reference-data.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RouteEstimationModule } from './modules/route-estimation/route-estimation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: Number(configService.get<string>('RATE_LIMIT_TTL_MS', '60000')),
          limit: Number(configService.get<string>('RATE_LIMIT_LIMIT', '60')),
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('DB_HOST', '127.0.0.1'),
        port: Number(configService.get<string>('DB_PORT', '3306')),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_NAME', 'advanced_wasel_palestine'),
        entities: [
          RoleEntity,
          UserEntity,
          ExternalApiCacheEntity,
          ExternalApiRequestLogEntity,
          CheckpointEntity,
          CheckpointStatusHistoryEntity,
          EmergencyServiceCenterEntity,
          IncidentCategoryEntity,
          IncidentEmergencyDispatchEntity,
          IncidentSeverityEntity,
          IncidentStatusEntity,
          IncidentEntity,
          IncidentStatusHistoryEntity,
          AlertSubscriptionEntity,
          AlertEntity,
          ReportEntity,
          ReportImageEntity,
          ReportImageAnalysisEntity,
          ReportVoteEntity,
          ReportModerationActionEntity,
          UserPointsLedgerEntity,
          RouteEstimationEntity,
          RouteEstimationConstraintEntity,
          RouteEstimationFactorEntity,
          AuditLogEntity,
        ],
        synchronize: configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
        timezone: 'Z',
      }),
    }),
    AuthModule,
    AlertsModule,
    AuditLogsModule,
    CheckpointsModule,
    ExternalIntelligenceModule,
    IncidentsModule,
    ReferenceDataModule,
    ReportsModule,
    RouteEstimationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
