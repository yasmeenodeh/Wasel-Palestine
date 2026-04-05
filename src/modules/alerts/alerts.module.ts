import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleHeaderGuard } from '../../common/guards/role-header.guard';
import { AlertSubscriptionEntity } from '../../database/entities/alert-subscription.entity';
import { AlertEntity } from '../../database/entities/alert.entity';
import { IncidentEntity } from '../../database/entities/incident.entity';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';

@Module({
  imports: [TypeOrmModule.forFeature([AlertSubscriptionEntity, AlertEntity, IncidentEntity])],
  controllers: [AlertsController],
  providers: [AlertsService, RoleHeaderGuard],
  exports: [AlertsService],
})
export class AlertsModule {}
