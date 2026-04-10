import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationService } from '../../common/domain/location.service';
import { RoleHeaderGuard } from '../../common/guards/role-header.guard';
import { AlertSubscriptionEntity } from '../../database/entities/alert-subscription.entity';
import { AlertEntity } from '../../database/entities/alert.entity';
import { IncidentEntity } from '../../database/entities/incident.entity';
import { AlertsService } from './application/alerts.service';
import { AlertsController } from './alerts.controller';
import { AlertGeographyService } from './domain/alert-geography.service';
import { AlertsQueryRepository } from './infrastructure/alerts-query.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AlertSubscriptionEntity, AlertEntity, IncidentEntity])],
  controllers: [AlertsController],
  providers: [AlertsService, AlertsQueryRepository, AlertGeographyService, LocationService, RoleHeaderGuard],
  exports: [AlertsService],
})
export class AlertsModule {}
