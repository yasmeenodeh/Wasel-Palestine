import { Injectable } from '@nestjs/common';

type AwardInput = {
  status: 'approved' | 'converted';
  trustStatus: 'suspicious' | 'needs_review' | 'trusted';
};

type AwardDefinition = {
  actionType: 'report_approved' | 'report_converted' | 'trusted_report_bonus';
  points: number;
  description: string;
};

@Injectable()
export class ReportPointsService {
  getAwards(input: AwardInput): AwardDefinition[] {
    const awards: AwardDefinition[] = [];

    if (input.status === 'approved') {
      awards.push({
        actionType: 'report_approved',
        points: 25,
        description: 'Points awarded for an approved report',
      });
    }

    if (input.status === 'converted') {
      awards.push({
        actionType: 'report_converted',
        points: 30,
        description: 'Points awarded for a report converted into an incident',
      });
    }

    if (input.trustStatus === 'trusted') {
      awards.push({
        actionType: 'trusted_report_bonus',
        points: 10,
        description: 'Bonus points awarded for a trusted report',
      });
    }

    return awards;
  }
}
