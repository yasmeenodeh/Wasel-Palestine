import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { ExternalApiCacheEntity } from '../../../database/entities/external-api-cache.entity';

@Injectable()
export class ExternalApiCacheRepository {
  constructor(
    @InjectRepository(ExternalApiCacheEntity)
    private readonly externalApiCacheRepository: Repository<ExternalApiCacheEntity>,
  ) {}

  findValid(provider: string, endpoint: string, cacheKey: string) {
    return this.externalApiCacheRepository.findOne({
      where: {
        provider,
        endpoint,
        cacheKey,
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  findLatest(provider: string, endpoint: string, cacheKey: string) {
    return this.externalApiCacheRepository.findOne({
      where: {
        provider,
        endpoint,
        cacheKey,
      },
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  async upsertCache(
    provider: string,
    endpoint: string,
    cacheKey: string,
    requestUrl: string,
    responsePayload: Record<string, unknown>,
    expiresAt: Date,
  ) {
    const existing = await this.externalApiCacheRepository.findOne({
      where: {
        provider,
        endpoint,
        cacheKey,
      },
    });

    if (existing) {
      existing.requestUrl = requestUrl;
      existing.responsePayload = responsePayload;
      existing.expiresAt = expiresAt;
      return this.externalApiCacheRepository.save(existing);
    }

    return this.externalApiCacheRepository.save(
      this.externalApiCacheRepository.create({
        provider,
        endpoint,
        cacheKey,
        requestUrl,
        responsePayload,
        expiresAt,
      }),
    );
  }
}
