import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportCredibilityService {
  calculateConfidenceScore(confirmVotes: number, denyVotes: number) {
    const totalVotes = confirmVotes + denyVotes;

    if (totalVotes === 0) {
      return '0.00';
    }

    return ((confirmVotes / totalVotes) * 100).toFixed(2);
  }

  isNearDuplicate(
    source: { latitude: string | number; longitude: string | number; reportedAt: Date | string },
    candidate: { latitude: number; longitude: number },
    maxDistanceDelta: number,
    maxHoursDelta: number,
  ) {
    const isNear =
      Math.abs(Number(source.latitude) - candidate.latitude) <= maxDistanceDelta &&
      Math.abs(Number(source.longitude) - candidate.longitude) <= maxDistanceDelta;
    const hoursDifference =
      Math.abs(Date.now() - new Date(source.reportedAt).getTime()) / (1000 * 60 * 60);

    return isNear && hoursDifference <= maxHoursDelta;
  }
}
