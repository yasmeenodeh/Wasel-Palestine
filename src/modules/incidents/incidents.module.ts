import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationService } from '../../common/domain/location.service';
import { AlertsModule } from '../alerts/alerts.module';
import { RoleHeaderGuard } from '../../common/guards/role-header.guard';
import { CheckpointEntity } from '../../database/entities/checkpoint.entity';
import { EmergencyServiceCenterEntity } from '../../database/entities/emergency-service-center.entity';
import { IncidentCategoryEntity } from '../../database/entities/incident-category.entity';
import { IncidentEmergencyDispatchEntity } from '../../database/entities/incident-emergency-dispatch.entity';
import { IncidentEntity } from '../../database/entities/incident.entity';
import { IncidentSeverityEntity } from '../../database/entities/incident-severity.entity';
import { IncidentStatusHistoryEntity } from '../../database/entities/incident-status-history.entity';
import { IncidentStatusEntity } from '../../database/entities/incident-status.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { IncidentEmergencyDispatchService } from './application/incident-emergency-dispatch.service';
import { IncidentsService } from './application/incidents.service';
import { IncidentsController } from './incidents.controller';
import { EmergencyDispatchPolicyService } from './domain/emergency-dispatch-policy.service';
import { IncidentStatusService } from './domain/incident-status.service';
import { IncidentsQueryRepository } from './infrastructure/incidents-query.repository';

@Module({
  imports: [
    AlertsModule,
    TypeOrmModule.forFeature([
      IncidentEntity,
      IncidentEmergencyDispatchEntity,
      IncidentStatusEntity,
      IncidentStatusHistoryEntity,
      IncidentCategoryEntity,
      IncidentSeverityEntity,
      EmergencyServiceCenterEntity,
      CheckpointEntity,
      UserEntity,
    ]),
  ],
  controllers: [IncidentsController],
  providers: [
    IncidentsService,
    IncidentEmergencyDispatchService,
    IncidentsQueryRepository,
    IncidentStatusService,
    EmergencyDispatchPolicyService,
    LocationService,
    RoleHeaderGuard,
  ],
  exports: [IncidentsService, IncidentEmergencyDispatchService],
})
export class IncidentsModule {}
