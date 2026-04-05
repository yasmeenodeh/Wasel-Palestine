import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertSubscriptionEntity } from './database/entities/alert-subscription.entity';
import { AlertEntity } from './database/entities/alert.entity';
import { AuditLogEntity } from './database/entities/audit-log.entity';
import { CheckpointStatusHistoryEntity } from './database/entities/checkpoint-status-history.entity';
import { CheckpointEntity } from './database/entities/checkpoint.entity';
import { IncidentCategoryEntity } from './database/entities/incident-category.entity';
import { IncidentEntity } from './database/entities/incident.entity';
import { IncidentSeverityEntity } from './database/entities/incident-severity.entity';
import { IncidentStatusHistoryEntity } from './database/entities/incident-status-history.entity';
import { IncidentStatusEntity } from './database/entities/incident-status.entity';
import { ReportModerationActionEntity } from './database/entities/report-moderation-action.entity';
import { ReportEntity } from './database/entities/report.entity';
import { ReportVoteEntity } from './database/entities/report-vote.entity';
import { RoleEntity } from './database/entities/role.entity';
import { UserEntity } from './database/entities/user.entity';
import { AlertsModule } from './modules/alerts/alerts.module';
import { CheckpointsModule } from './modules/checkpoints/checkpoints.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('DB_HOST', '127.0.0.1'),
        port: Number(configService.get<string>('DB_PORT', '3306')),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_NAME', 'wasel_palestine'),
        entities: [
          RoleEntity,
          UserEntity,
          CheckpointEntity,
          CheckpointStatusHistoryEntity,
          IncidentCategoryEntity,
          IncidentSeverityEntity,
          IncidentStatusEntity,
          IncidentEntity,
          IncidentStatusHistoryEntity,
          AlertSubscriptionEntity,
          AlertEntity,
          ReportEntity,
          ReportVoteEntity,
          ReportModerationActionEntity,
          AuditLogEntity,
        ],
        synchronize: false,
        timezone: 'Z',
      }),
    }),
    AlertsModule,
    CheckpointsModule,
    IncidentsModule,
    ReportsModule,
  ],
})
export class AppModule {}
