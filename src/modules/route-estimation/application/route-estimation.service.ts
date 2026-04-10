import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationService } from '../../../common/domain/location.service';
import { CheckpointEntity } from '../../../database/entities/checkpoint.entity';
import { IncidentEntity } from '../../../database/entities/incident.entity';
import { RouteEstimationConstraintEntity } from '../../../database/entities/route-estimation-constraint.entity';
import { RouteEstimationFactorEntity } from '../../../database/entities/route-estimation-factor.entity';
import { RouteEstimationEntity } from '../../../database/entities/route-estimation.entity';
import { EstimateRouteDto } from '../dto/estimate-route.dto';
import { ListRouteEstimationsDto } from '../dto/list-route-estimations.dto';
import { RouteEstimationResultFactory } from '../domain/route-estimation-result.factory';
import { RouteEstimationQueryRepository } from '../infrastructure/route-estimation-query.repository';

@Injectable()
export class RouteEstimationService {
  constructor(
    @InjectRepository(CheckpointEntity)
    private readonly checkpointRepository: Repository<CheckpointEntity>,
    @InjectRepository(IncidentEntity)
    private readonly incidentRepository: Repository<IncidentEntity>,
    @InjectRepository(RouteEstimationEntity)
    private readonly routeEstimationRepository: Repository<RouteEstimationEntity>,
    @InjectRepository(RouteEstimationConstraintEntity)
    private readonly routeEstimationConstraintRepository: Repository<RouteEstimationConstraintEntity>,
    @InjectRepository(RouteEstimationFactorEntity)
    private readonly routeEstimationFactorRepository: Repository<RouteEstimationFactorEntity>,
    private readonly locationService: LocationService,
    private readonly routeEstimationResultFactory: RouteEstimationResultFactory,
    private readonly routeEstimationQueryRepository: RouteEstimationQueryRepository,
  ) {}

  list(query: ListRouteEstimationsDto) {
    return this.routeEstimationQueryRepository.list(query);
  }

  findOne(id: string) {
    return this.routeEstimationQueryRepository.findOne(id);
  }

  async estimateRoute(dto: EstimateRouteDto) {
    const distanceKm = this.locationService.calculateDistanceKm(
      dto.startLat,
      dto.startLng,
      dto.endLat,
      dto.endLng,
    );

    const checkpoints = await this.checkpointRepository.find();
    const incidents = await this.incidentRepository.find({
      relations: {
        status: true,
      },
    });

    const nearbyCheckpoints = checkpoints.filter((checkpoint) =>
      this.locationService.calculateDistanceKm(
        dto.startLat,
        dto.startLng,
        Number(checkpoint.latitude),
        Number(checkpoint.longitude),
      ) <= 5,
    );

    const nearbyIncidents = incidents.filter((incident) => {
      const incidentStatus = incident.status?.name?.toLowerCase();

      if (incidentStatus !== 'verified' && incidentStatus !== 'active') {
        return false;
      }

      return (
        this.locationService.calculateDistanceKm(
          dto.startLat,
          dto.startLng,
          Number(incident.latitude),
          Number(incident.longitude),
        ) <= 5
      );
    });

    const result = this.routeEstimationResultFactory.create(
      dto,
      distanceKm,
      nearbyCheckpoints,
      nearbyIncidents,
    );
    const routeEstimation = await this.routeEstimationRepository.save(
      this.routeEstimationRepository.create({
        startLat: dto.startLat.toString(),
        startLng: dto.startLng.toString(),
        endLat: dto.endLat.toString(),
        endLng: dto.endLng.toString(),
        estimatedDistanceKm: result.estimatedDistanceKm.toFixed(2),
        estimatedDurationMinutes: result.estimatedDurationMinutes,
        baseDurationMinutes: result.baseDurationMinutes,
        constraintsDelayMinutes: result.constraintsDelayMinutes,
        mobilityDelayMinutes: result.mobilityDelayMinutes,
        metadata: result.metadata,
      }),
    );

    if (result.constraints.length > 0) {
      await this.routeEstimationConstraintRepository.save(
        result.constraints.map((constraint) =>
          this.routeEstimationConstraintRepository.create({
            routeEstimationId: routeEstimation.id,
            constraintType: constraint.constraintType,
            value: constraint.value,
          }),
        ),
      );
    }

    if (result.factors.length > 0) {
      await this.routeEstimationFactorRepository.save(
        result.factors.map((factor) =>
          this.routeEstimationFactorRepository.create({
            routeEstimationId: routeEstimation.id,
            factorType: factor.factorType,
            description: factor.description,
            delayMinutes: factor.delayMinutes,
            affectedCheckpointId: factor.affectedCheckpointId,
            affectedIncidentId: factor.affectedIncidentId,
          }),
        ),
      );
    }

    return this.findOne(routeEstimation.id);
  }

  async recalculate(id: string) {
    const routeEstimation = await this.findOne(id);
    return this.estimateRoute({
      startLat: Number(routeEstimation.startLat),
      startLng: Number(routeEstimation.startLng),
      endLat: Number(routeEstimation.endLat),
      endLng: Number(routeEstimation.endLng),
      avoidCheckpoints: routeEstimation.constraints.some(
        (constraint) => constraint.constraintType === 'avoid_checkpoints',
      ),
      avoidAreas: routeEstimation.constraints
        .filter((constraint) => constraint.constraintType === 'avoid_area')
        .map((constraint) => constraint.value ?? '')
        .filter((value) => value.length > 0),
    });
  }
}
