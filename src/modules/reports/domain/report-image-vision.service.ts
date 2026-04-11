import { Injectable } from '@nestjs/common';

type VisionInput = {
  imageUrl: string;
  mediaType: 'accident' | 'checkpoint' | 'traffic';
  reportDescription: string;
};

type VisionDetection = {
  detectedLabel: string;
  confidenceScore: string;
  summary: string;
  severityHint: string | null;
  isRelevant: boolean;
};

@Injectable()
export class ReportImageVisionService {
  analyze(input: VisionInput): VisionDetection[] {
    const source = `${input.imageUrl} ${input.reportDescription}`.toLowerCase();

    if (input.mediaType === 'accident' || this.hasAny(source, ['accident', 'crash', 'broken', 'damaged'])) {
      return [
        {
          detectedLabel: 'broken_vehicle',
          confidenceScore: '91.00',
          summary: 'Simulated vision detected a damaged or immobilized vehicle in the image.',
          severityHint: 'high',
          isRelevant: true,
        },
      ];
    }

    if (input.mediaType === 'traffic' || this.hasAny(source, ['traffic', 'jam', 'congestion', 'queue'])) {
      return [
        {
          detectedLabel: 'traffic_congestion',
          confidenceScore: '88.00',
          summary: 'Simulated vision detected dense traffic congestion and slow movement conditions.',
          severityHint: 'medium',
          isRelevant: true,
        },
      ];
    }

    if (input.mediaType === 'checkpoint' || this.hasAny(source, ['checkpoint', 'closed', 'barrier', 'roadblock'])) {
      return [
        {
          detectedLabel: 'road_closed',
          confidenceScore: '86.00',
          summary: 'Simulated vision detected a blocked road or checkpoint barrier in the image.',
          severityHint: 'high',
          isRelevant: true,
        },
      ];
    }

    return [
      {
        detectedLabel: 'uncertain_scene',
        confidenceScore: '45.00',
        summary: 'Simulated vision could not classify the scene confidently.',
        severityHint: null,
        isRelevant: false,
      },
    ];
  }

  private hasAny(source: string, keywords: string[]) {
    return keywords.some((keyword) => source.includes(keyword));
  }
}
