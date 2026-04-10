import { Injectable } from '@nestjs/common';
import { LocationService } from '../../../common/domain/location.service';

@Injectable()
export class AlertGeographyService {
  constructor(private readonly locationService: LocationService) {}

  matches(geographicArea: string, latitude: number, longitude: number) {
    const normalized = geographicArea.trim().toLowerCase();

    if (normalized === 'all') {
      return true;
    }

    const circleMatch = normalized.match(/^circle:([-0-9.]+),([-0-9.]+),([0-9.]+)$/);

    if (circleMatch) {
      const centerLat = Number(circleMatch[1]);
      const centerLng = Number(circleMatch[2]);
      const radiusKm = Number(circleMatch[3]);
      const distanceKm = this.locationService.calculateDistanceKm(
        centerLat,
        centerLng,
        latitude,
        longitude,
      );
      return distanceKm <= radiusKm;
    }

    const boxMatch = normalized.match(/^bbox:([-0-9.]+),([-0-9.]+),([-0-9.]+),([-0-9.]+)$/);

    if (boxMatch) {
      const minLat = Number(boxMatch[1]);
      const minLng = Number(boxMatch[2]);
      const maxLat = Number(boxMatch[3]);
      const maxLng = Number(boxMatch[4]);
      return latitude >= minLat && latitude <= maxLat && longitude >= minLng && longitude <= maxLng;
    }

    return false;
  }
}
