import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { ExternalApiRequestLogEntity } from '../../../database/entities/external-api-request-log.entity';

type CreateExternalRequestLogInput = {
  provider: string;
  endpoint: string;
  cacheKey: string | null;
  requestUrl: string;
  statusCode: number | null;
  durationMs: number | null;
  wasCached: boolean;
  wasSuccessful: boolean;
  errorMessage: string | null;
};

@Injectable()
export class ExternalApiRequestLogRepository {
  constructor(
    @InjectRepository(ExternalApiRequestLogEntity)
    private readonly externalApiRequestLogRepository: Repository<ExternalApiRequestLogEntity>,
  ) {}

  countRecentProviderRequests(provider: string, windowStartedAt: Date) {
    return this.externalApiRequestLogRepository.count({
      where: {
        provider,
        wasCached: false,
        createdAt: MoreThanOrEqual(windowStartedAt),
      },
    });
  }

  async createLog(input: CreateExternalRequestLogInput) {
    return this.externalApiRequestLogRepository.save(
      this.externalApiRequestLogRepository.create(input),
    );
  }
}
