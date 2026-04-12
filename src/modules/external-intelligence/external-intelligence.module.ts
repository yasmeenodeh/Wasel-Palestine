import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalApiCacheEntity } from '../../database/entities/external-api-cache.entity';
import { ExternalApiRequestLogEntity } from '../../database/entities/external-api-request-log.entity';
import { ExternalIntelligenceController } from './external-intelligence.controller';
import { ExternalIntelligenceService } from './application/external-intelligence.service';
import { ExternalProviderPolicyService } from './domain/external-provider-policy.service';
import { ExternalApiCacheRepository } from './infrastructure/external-api-cache.repository';
import { ExternalApiRequestLogRepository } from './infrastructure/external-api-request-log.repository';
import { OpenMeteoClient } from './infrastructure/open-meteo.client';
import { OpenRouteServiceClient } from './infrastructure/open-route-service.client';
import { OpenWeatherMapClient } from './infrastructure/open-weather-map.client';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExternalApiCacheEntity, ExternalApiRequestLogEntity]),
  ],
  controllers: [ExternalIntelligenceController],
  providers: [
    ExternalIntelligenceService,
    ExternalProviderPolicyService,
    ExternalApiCacheRepository,
    ExternalApiRequestLogRepository,
    OpenMeteoClient,
    OpenRouteServiceClient,
    OpenWeatherMapClient,
  ],
  exports: [ExternalIntelligenceService],
})
export class ExternalIntelligenceModule {}
