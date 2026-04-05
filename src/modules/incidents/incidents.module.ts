import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsModule } from '../alerts/alerts.module';
import { RoleHeaderGuard } from '../../common/guards/role-header.guard';
import { CheckpointEntity } from '../../database/entities/checkpoint.entity';
import { IncidentCategoryEntity } from '../../database/entities/incident-category.entity';
import { IncidentEntity } from '../../database/entities/incident.entity';
import { IncidentSeverityEntity } from '../../database/entities/incident-severity.entity';
import { IncidentStatusHistoryEntity } from '../../database/entities/incident-status-history.entity';
import { IncidentStatusEntity } from '../../database/entities/incident-status.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';

@Module({
  imports: [
    AlertsModule,
    TypeOrmModule.forFeature([
      IncidentEntity,
      IncidentStatusEntity,
      IncidentStatusHistoryEntity,
      IncidentCategoryEntity,
      IncidentSeverityEntity,
      CheckpointEntity,
      UserEntity,
    ]),
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService, RoleHeaderGuard],
  exports: [IncidentsService],
})
export class IncidentsModule {}
