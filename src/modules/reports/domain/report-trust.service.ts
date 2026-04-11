import { Injectable } from '@nestjs/common';

type ReportTrustInput = {
  confirmVotes: number;
  denyVotes: number;
  corroboratingReportsCount: number;
  duplicateOfReportId: string | null;
  reporterReliability: number;
  imageEvidenceCount: number;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'merged' | 'converted';
};

type ReportTrustAssessment = {
  trustScore: string;
  trustStatus: 'suspicious' | 'needs_review' | 'trusted';
  trustReasons: string[];
};

@Injectable()
export class ReportTrustService {
  assess(input: ReportTrustInput): ReportTrustAssessment {
    const reasons: string[] = [];
    let score = 15;

    if (input.corroboratingReportsCount > 0) {
      const corroborationBoost = Math.min(30, input.corroboratingReportsCount * 12);
      score += corroborationBoost;
      reasons.push(`Supported by ${input.corroboratingReportsCount} nearby report(s) from other users`);
    } else {
      score -= 10;
      reasons.push('No nearby supporting reports from other users');
    }

    if (input.duplicateOfReportId) {
      score += 10;
      reasons.push('Linked to an existing duplicate cluster');
    }

    if (input.confirmVotes > 0) {
      const confirmBoost = Math.min(20, input.confirmVotes * 8);
      score += confirmBoost;
      reasons.push(`Received ${input.confirmVotes} community confirmation vote(s)`);
    }

    if (input.denyVotes > 0) {
      const denyPenalty = Math.min(24, input.denyVotes * 12);
      score -= denyPenalty;
      reasons.push(`Received ${input.denyVotes} community denial vote(s)`);
    }

    const reliabilityBoost = Math.round(input.reporterReliability * 25);
    score += reliabilityBoost;

    if (input.reporterReliability >= 0.7) {
      reasons.push('Reporter has a strong history of accurate submissions');
    } else if (input.reporterReliability <= 0.3) {
      reasons.push('Reporter has limited or weak historical accuracy');
    } else {
      reasons.push('Reporter has a moderate historical accuracy record');
    }

    if (input.imageEvidenceCount > 0) {
      score += Math.min(12, input.imageEvidenceCount * 6);
      reasons.push(`Includes ${input.imageEvidenceCount} visual evidence item(s)`);
    }

    if (input.status === 'approved' || input.status === 'converted') {
      score += 20;
      reasons.push('Moderator validated the report outcome');
    }

    if (input.status === 'rejected') {
      score -= 35;
      reasons.push('Moderator rejected the report');
    }

    if (input.status === 'merged') {
      score += 5;
      reasons.push('Merged into another report for the same event');
    }

    const normalizedScore = Math.max(0, Math.min(100, score));
    const trustStatus = this.resolveTrustStatus(normalizedScore, input);

    return {
      trustScore: normalizedScore.toFixed(2),
      trustStatus,
      trustReasons: reasons,
    };
  }

  private resolveTrustStatus(
    score: number,
    input: ReportTrustInput,
  ): 'suspicious' | 'needs_review' | 'trusted' {
    if (input.status === 'rejected' || score < 40) {
      return 'suspicious';
    }

    if (score >= 70) {
      return 'trusted';
    }

    return 'needs_review';
  }
}
