import { Injectable } from '@nestjs/common';

type EmergencyServiceType = 'police' | 'ambulance' | 'hospital';

@Injectable()
export class EmergencyDispatchPolicyService {
  private readonly accidentKeywords = ['accident', 'crash', 'collision', 'vehicle', 'road'];

  shouldDispatch(input: { categoryName?: string | null; title: string; description: string }) {
    const categoryName = input.categoryName?.trim().toLowerCase() ?? '';
    const text = `${input.title} ${input.description}`.toLowerCase();

    if (categoryName.includes('accident')) {
      return true;
    }

    return this.accidentKeywords.some((keyword) => text.includes(keyword));
  }

  requiredServiceTypes(): EmergencyServiceType[] {
    return ['police', 'ambulance', 'hospital'];
  }
}
