import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationService } from '../../common/domain/location.service';
import { CheckpointEntity } from '../../database/entities/checkpoint.entity';
import { IncidentEntity } from '../../database/entities/incident.entity';
import { RouteEstimationConstraintEntity } from '../../database/entities/route-estimation-constraint.entity';
import { RouteEstimationFactorEntity } from '../../database/entities/route-estimation-factor.entity';
import { RouteEstimationEntity } from '../../database/entities/route-estimation.entity';
import { RouteEstimationController } from './route-estimation.controller';
import { RouteEstimationService } from './application/route-estimation.service';
import { RouteEstimationPolicyService } from './domain/route-estimation-policy.service';
import { RouteEstimationResultFactory } from './domain/route-estimation-result.factory';
import { RouteEstimationQueryRepository } from './infrastructure/route-estimation-query.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CheckpointEntity,
      IncidentEntity,
      RouteEstimationEntity,
      RouteEstimationConstraintEntity,
      RouteEstimationFactorEntity,
    ]),
  ],
  controllers: [RouteEstimationController],
  providers: [
    RouteEstimationService,
    RouteEstimationPolicyService,
    RouteEstimationResultFactory,
    RouteEstimationQueryRepository,
    LocationService,
  ],
})
export class RouteEstimationModule {}
