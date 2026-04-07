import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstimateRouteDto } from './dto/estimate-route.dto';
import { CheckpointEntity } from '../../database/entities/checkpoint.entity';
import { IncidentEntity } from '../../database/entities/incident.entity';

@Injectable()
export class RouteEstimationService {
  constructor(
    @InjectRepository(CheckpointEntity)
    private readonly checkpointRepository: Repository<CheckpointEntity>,

    @InjectRepository(IncidentEntity)
    private readonly incidentRepository: Repository<IncidentEntity>,
  ) {}

  async estimateRoute(dto: EstimateRouteDto) {
    const distanceKm = this.calculateDistance(
      dto.startLat,
      dto.startLng,
      dto.endLat,
      dto.endLng,
    );

    const baseDurationMinutes = distanceKm * 2;
    let constraintsDelayMinutes = 0;
    let mobilityDelayMinutes = 0;
    const affectingFactors: string[] = [];

    if (dto.avoidCheckpoints) {
      constraintsDelayMinutes += 15;
      affectingFactors.push('Route adjusted to avoid checkpoints');
    }

    if (dto.avoidAreas && dto.avoidAreas.length > 0) {
      constraintsDelayMinutes += dto.avoidAreas.length * 5;
      affectingFactors.push(`Avoided ${dto.avoidAreas.length} specific area(s)`);
    }

    const checkpoints = await this.checkpointRepository.find();
    const incidents = await this.incidentRepository.find();

    const nearbyCheckpoints = checkpoints.filter((checkpoint) => {
      const distanceFromStart = this.calculateDistance(
        dto.startLat,
        dto.startLng,
        Number(checkpoint.latitude),
        Number(checkpoint.longitude),
      );

      return distanceFromStart <= 5;
    });

    const nearbyIncidents = incidents.filter((incident) => {
      const distanceFromStart = this.calculateDistance(
        dto.startLat,
        dto.startLng,
        Number(incident.latitude),
        Number(incident.longitude),
      );

      return distanceFromStart <= 5;
    });

    const activeCheckpoints = nearbyCheckpoints.filter(
      (checkpoint) => checkpoint.currentStatus.toLowerCase() === 'active',
    );

    if (activeCheckpoints.length > 0) {
      const checkpointDelay = activeCheckpoints.length * 10;
      mobilityDelayMinutes += checkpointDelay;
      affectingFactors.push(
        `${activeCheckpoints.length} active checkpoint(s) affected the route`,
      );
    }

    let incidentDelay = 0;

    for (const incident of nearbyIncidents) {
      const severityId = Number(incident.severityId);

      if (severityId === 3) {
        incidentDelay += 10;
      } else if (severityId === 2) {
        incidentDelay += 6;
      } else {
        incidentDelay += 3;
      }
    }

    if (nearbyIncidents.length > 0) {
      mobilityDelayMinutes += incidentDelay;
      affectingFactors.push(
        `${nearbyIncidents.length} nearby incident(s) increased route duration`,
      );
    }

    const estimatedDurationMinutes =
      baseDurationMinutes + constraintsDelayMinutes + mobilityDelayMinutes;

    return {
      estimatedDistanceKm: Number(distanceKm.toFixed(2)),
      estimatedDurationMinutes: Number(estimatedDurationMinutes.toFixed(0)),
      metadata: {
        baseDurationMinutes: Number(baseDurationMinutes.toFixed(0)),
        constraintsDelayMinutes,
        mobilityDelayMinutes,
        factorsAffectingRoute: affectingFactors,
        note: 'This route estimation is heuristic-based and enriched with local mobility data.',
      },
    };
  }

  private calculateDistance(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
  ): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;

    const dLat = toRad(endLat - startLat);
    const dLng = toRad(endLng - startLng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(startLat)) *
        Math.cos(toRad(endLat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
  }
}