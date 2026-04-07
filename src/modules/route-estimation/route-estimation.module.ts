import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteEstimationController } from './route-estimation.controller';
import { RouteEstimationService } from './route-estimation.service';
import { CheckpointEntity } from '../../database/entities/checkpoint.entity';
import { IncidentEntity } from '../../database/entities/incident.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CheckpointEntity, IncidentEntity])],
  controllers: [RouteEstimationController],
  providers: [RouteEstimationService],
})
export class RouteEstimationModule {}