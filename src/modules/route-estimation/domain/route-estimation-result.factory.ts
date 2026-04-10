import { Injectable } from '@nestjs/common';
import { CheckpointEntity } from '../../../database/entities/checkpoint.entity';
import { IncidentEntity } from '../../../database/entities/incident.entity';
import { EstimateRouteDto } from '../dto/estimate-route.dto';
import { RouteEstimationPolicyService } from './route-estimation-policy.service';

type RouteEstimationFactorRecord = {
  factorType: string;
  description: string;
  delayMinutes: number;
  affectedCheckpointId: string | null;
  affectedIncidentId: string | null;
};

@Injectable()
export class RouteEstimationResultFactory {
  constructor(private readonly routeEstimationPolicyService: RouteEstimationPolicyService) {}

  create(
    dto: EstimateRouteDto,
    distanceKm: number,
    nearbyCheckpoints: CheckpointEntity[],
    nearbyIncidents: IncidentEntity[],
  ) {
    const baseDurationMinutes =
      this.routeEstimationPolicyService.calculateBaseDurationMinutes(distanceKm);
    const constraints = this.routeEstimationPolicyService.calculateConstraintsDelay(
      dto.avoidCheckpoints,
      dto.avoidAreas,
    );

    const checkpointFactors = nearbyCheckpoints
      .filter((checkpoint) => checkpoint.currentStatus.toLowerCase() === 'active')
      .map<RouteEstimationFactorRecord>((checkpoint) => ({
        factorType: 'checkpoint',
        description: `Checkpoint "${checkpoint.name}" affected the route`,
        delayMinutes: 10,
        affectedCheckpointId: checkpoint.id,
        affectedIncidentId: null,
      }));

    const incidentFactors = nearbyIncidents.map<RouteEstimationFactorRecord>((incident) => ({
      factorType: 'incident',
      description: `Incident "${incident.title}" increased route duration`,
      delayMinutes: this.routeEstimationPolicyService.calculateIncidentDelay([incident]).delay,
      affectedCheckpointId: null,
      affectedIncidentId: incident.id,
    }));

    const constraintFactors = [
      ...(dto.avoidCheckpoints
        ? [
            {
              factorType: 'constraint',
              description: 'Route adjusted to avoid checkpoints',
              delayMinutes: 15,
              affectedCheckpointId: null,
              affectedIncidentId: null,
            },
          ]
        : []),
      ...((dto.avoidAreas ?? []).map<RouteEstimationFactorRecord>((area) => ({
        factorType: 'constraint',
        description: `Route adjusted to avoid area "${area}"`,
        delayMinutes: 5,
        affectedCheckpointId: null,
        affectedIncidentId: null,
      }))),
    ];

    const factors = [...constraintFactors, ...checkpointFactors, ...incidentFactors];
    const mobilityDelayMinutes = checkpointFactors.reduce((sum, factor) => sum + factor.delayMinutes, 0)
      + incidentFactors.reduce((sum, factor) => sum + factor.delayMinutes, 0);
    const estimatedDurationMinutes =
      baseDurationMinutes + constraints.delay + mobilityDelayMinutes;

    return {
      estimatedDistanceKm: Number(distanceKm.toFixed(2)),
      estimatedDurationMinutes: Number(estimatedDurationMinutes.toFixed(0)),
      baseDurationMinutes: Number(baseDurationMinutes.toFixed(0)),
      constraintsDelayMinutes: constraints.delay,
      mobilityDelayMinutes,
      constraints: [
        ...(dto.avoidCheckpoints ? [{ constraintType: 'avoid_checkpoints', value: 'true' }] : []),
        ...((dto.avoidAreas ?? []).map((area) => ({
          constraintType: 'avoid_area',
          value: area,
        }))),
      ],
      factors,
      metadata: {
        baseDurationMinutes: Number(baseDurationMinutes.toFixed(0)),
        constraintsDelayMinutes: constraints.delay,
        mobilityDelayMinutes,
        factorsAffectingRoute: factors.map((factor) => factor.description),
        note: 'This route estimation is heuristic-based and enriched with local mobility data.',
      },
    };
  }
}
