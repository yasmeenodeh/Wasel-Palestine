import { Injectable } from '@nestjs/common';
import { CheckpointEntity } from '../../../database/entities/checkpoint.entity';
import { IncidentEntity } from '../../../database/entities/incident.entity';

type WeatherContext = {
  condition: string;
  windSpeedMps: number | null;
  rainVolumeMm: number | null;
  visibilityMeters: number | null;
};

@Injectable()
export class RouteEstimationPolicyService {
  calculateBaseDurationMinutes(distanceKm: number) {
    return distanceKm * 2;
  }

  calculateConstraintsDelay(avoidCheckpoints?: boolean, avoidAreas?: string[]) {
    let delay = 0;
    const factors: string[] = [];

    if (avoidCheckpoints) {
      delay += 15;
      factors.push('Route adjusted to avoid checkpoints');
    }

    if (avoidAreas && avoidAreas.length > 0) {
      delay += avoidAreas.length * 5;
      factors.push(`Avoided ${avoidAreas.length} specific area(s)`);
    }

    return { delay, factors };
  }

  calculateCheckpointDelay(checkpoints: CheckpointEntity[]) {
    const activeCheckpoints = checkpoints.filter(
      (checkpoint) => checkpoint.currentStatus.toLowerCase() === 'active',
    );
    const delay = activeCheckpoints.length * 10;
    const factors =
      activeCheckpoints.length > 0
        ? [`${activeCheckpoints.length} active checkpoint(s) affected the route`]
        : [];

    return { delay, factors };
  }

  calculateIncidentDelay(incidents: IncidentEntity[]) {
    let delay = 0;

    for (const incident of incidents) {
      const severityId = Number(incident.severityId);

      if (severityId >= 4) delay += 14;
      else if (severityId === 3) delay += 10;
      else if (severityId === 2) delay += 6;
      else delay += 3;
    }

    const factors =
      incidents.length > 0 ? [`${incidents.length} nearby incident(s) increased route duration`] : [];

    return { delay, factors };
  }

  calculateWeatherDelay(weather: WeatherContext | null) {
    if (!weather) {
      return { delay: 0, factors: [] as string[] };
    }

    let delay = 0;
    const normalizedCondition = weather.condition.toLowerCase();

    if (normalizedCondition.includes('thunderstorm')) {
      delay += 12;
    } else if (normalizedCondition.includes('snow')) {
      delay += 10;
    } else if (normalizedCondition.includes('rain') || normalizedCondition.includes('drizzle')) {
      delay += 7;
    } else if (
      normalizedCondition.includes('fog')
      || normalizedCondition.includes('mist')
      || normalizedCondition.includes('haze')
      || normalizedCondition.includes('dust')
      || normalizedCondition.includes('sand')
    ) {
      delay += 6;
    }

    if ((weather.windSpeedMps ?? 0) >= 10) {
      delay += 4;
    }

    if ((weather.rainVolumeMm ?? 0) >= 2) {
      delay += 3;
    }

    if ((weather.visibilityMeters ?? 10000) <= 3000) {
      delay += 4;
    }

    const factors = delay > 0 ? ['Current weather conditions increased route duration'] : [];

    return { delay, factors };
  }
}
