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

type ExternalRouteContext = {
  distanceKm: number;
  durationMinutes: number;
  provider: string;
  source: string;
};

type ExternalWeatherContext = {
  provider: string;
  source: string;
  locationName: string | null;
  condition: string;
  description: string;
  temperatureC: number | null;
  feelsLikeC: number | null;
  windSpeedMps: number | null;
  rainVolumeMm: number | null;
  visibilityMeters: number | null;
};

@Injectable()
export class RouteEstimationResultFactory {
  constructor(private readonly routeEstimationPolicyService: RouteEstimationPolicyService) {}

  create(
    dto: EstimateRouteDto,
    routeContext: ExternalRouteContext,
    nearbyCheckpoints: CheckpointEntity[],
    nearbyIncidents: IncidentEntity[],
    weatherContext: ExternalWeatherContext | null,
  ) {
    const distanceKm = routeContext.distanceKm;
    const baseDurationMinutes = routeContext.durationMinutes > 0
      ? routeContext.durationMinutes
      : this.routeEstimationPolicyService.calculateBaseDurationMinutes(distanceKm);
    const constraints = this.routeEstimationPolicyService.calculateConstraintsDelay(
      dto.avoidCheckpoints,
      dto.avoidAreas,
    );
    const weatherImpact = this.routeEstimationPolicyService.calculateWeatherDelay(
      weatherContext
        ? {
            condition: weatherContext.condition,
            windSpeedMps: weatherContext.windSpeedMps,
            rainVolumeMm: weatherContext.rainVolumeMm,
            visibilityMeters: weatherContext.visibilityMeters,
          }
        : null,
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

    const weatherFactors =
      weatherContext && weatherImpact.delay > 0
        ? [
            {
              factorType: 'weather',
              description: `Weather impact near ${weatherContext.locationName ?? 'destination'}: ${weatherContext.description}`,
              delayMinutes: weatherImpact.delay,
              affectedCheckpointId: null,
              affectedIncidentId: null,
            },
          ]
        : [];

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

    const factors = [...constraintFactors, ...checkpointFactors, ...incidentFactors, ...weatherFactors];
    const mobilityDelayMinutes = checkpointFactors.reduce((sum, factor) => sum + factor.delayMinutes, 0)
      + incidentFactors.reduce((sum, factor) => sum + factor.delayMinutes, 0)
      + weatherFactors.reduce((sum, factor) => sum + factor.delayMinutes, 0);
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
        routeProvider: routeContext.provider,
        routeProviderSource: routeContext.source,
        weatherProvider: weatherContext?.provider ?? null,
        weatherProviderSource: weatherContext?.source ?? null,
        baseDurationMinutes: Number(baseDurationMinutes.toFixed(0)),
        constraintsDelayMinutes: constraints.delay,
        mobilityDelayMinutes,
        destinationWeather: weatherContext
          ? {
              locationName: weatherContext.locationName,
              condition: weatherContext.condition,
              description: weatherContext.description,
              temperatureC: weatherContext.temperatureC,
              feelsLikeC: weatherContext.feelsLikeC,
              windSpeedMps: weatherContext.windSpeedMps,
              rainVolumeMm: weatherContext.rainVolumeMm,
              visibilityMeters: weatherContext.visibilityMeters,
            }
          : null,
        factorsAffectingRoute: factors.map((factor) => factor.description),
        note: 'This route estimation uses OpenRouteService and OpenWeatherMap enriched with local mobility data.',
      },
    };
  }
}
