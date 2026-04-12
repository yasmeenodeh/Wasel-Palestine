import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { GetCurrentWeatherDto } from '../dto/get-current-weather.dto';
import { SearchLocationDto } from '../dto/search-location.dto';
import { ExternalProviderPolicyService } from '../domain/external-provider-policy.service';
import { ExternalApiCacheRepository } from '../infrastructure/external-api-cache.repository';
import { ExternalApiRequestLogRepository } from '../infrastructure/external-api-request-log.repository';
import { OpenMeteoClient } from '../infrastructure/open-meteo.client';
import { OpenRouteServiceClient } from '../infrastructure/open-route-service.client';
import { OpenWeatherMapClient } from '../infrastructure/open-weather-map.client';

type CachedPayload<T> = T & {
  source: 'provider' | 'cache' | 'stale-cache';
};

@Injectable()
export class ExternalIntelligenceService {
  constructor(
    private readonly externalProviderPolicyService: ExternalProviderPolicyService,
    private readonly externalApiCacheRepository: ExternalApiCacheRepository,
    private readonly externalApiRequestLogRepository: ExternalApiRequestLogRepository,
    private readonly openMeteoClient: OpenMeteoClient,
    private readonly openRouteServiceClient: OpenRouteServiceClient,
    private readonly openWeatherMapClient: OpenWeatherMapClient,
  ) {}

  getRouteDirections(input: {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
  }) {
    return this.resolveWithCache(
      'openrouteservice',
      'directions',
      input,
      async () => this.openRouteServiceClient.getDirections(input),
    );
  }

  searchLocations(dto: SearchLocationDto) {
    return this.resolveWithCache(
      'openrouteservice',
      'geocode_search',
      { query: dto.query.trim().toLowerCase() },
      async () => this.openRouteServiceClient.searchLocations(dto.query.trim()),
    );
  }

  getCurrentWeather(dto: GetCurrentWeatherDto) {
    const cacheInput = {
      lat: Number(dto.lat.toFixed(4)),
      lng: Number(dto.lng.toFixed(4)),
    };

    return this.resolvePrimaryThenFallback(cacheInput, dto);
  }

  private async resolveWithCache<T extends Record<string, unknown>>(
    provider: 'openrouteservice' | 'openweathermap' | 'openmeteo',
    endpoint: 'directions' | 'geocode_search' | 'current_weather',
    cacheInput: Record<string, unknown>,
    loader: () => Promise<{ requestUrl: string; statusCode: number } & T>,
  ): Promise<CachedPayload<T>> {
    const cacheKey = this.createCacheKey(provider, endpoint, cacheInput);
    const validCache = await this.externalApiCacheRepository.findValid(provider, endpoint, cacheKey);

    if (validCache) {
      await this.externalApiRequestLogRepository.createLog({
        provider,
        endpoint,
        cacheKey,
        requestUrl: validCache.requestUrl,
        statusCode: 200,
        durationMs: 0,
        wasCached: true,
        wasSuccessful: true,
        errorMessage: null,
      });

      return {
        ...(validCache.responsePayload as T),
        source: 'cache',
      };
    }

    const windowStartedAt = new Date(Date.now() - 60 * 1000);
    const requestCount = await this.externalApiRequestLogRepository.countRecentProviderRequests(
      provider,
      windowStartedAt,
    );
    const rateLimit = this.externalProviderPolicyService.getRateLimitPerMinute(provider);

    if (requestCount >= rateLimit) {
      const latestCache = await this.externalApiCacheRepository.findLatest(provider, endpoint, cacheKey);

      if (latestCache) {
        await this.externalApiRequestLogRepository.createLog({
          provider,
          endpoint,
          cacheKey,
          requestUrl: latestCache.requestUrl,
          statusCode: 200,
          durationMs: 0,
          wasCached: true,
          wasSuccessful: true,
          errorMessage: 'Served stale cache because provider rate limit threshold was reached.',
        });

        return {
          ...(latestCache.responsePayload as T),
          source: 'stale-cache',
        };
      }

      throw new HttpException(
        `External provider limit reached for ${provider}.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const startedAt = Date.now();

    try {
      const response = await loader();
      const durationMs = Date.now() - startedAt;
      const payload = Object.fromEntries(
        Object.entries(response).filter(([key]) => key !== 'requestUrl' && key !== 'statusCode'),
      ) as T;

      await this.externalApiCacheRepository.upsertCache(
        provider,
        endpoint,
        cacheKey,
        response.requestUrl,
        payload,
        new Date(Date.now() + this.externalProviderPolicyService.getCacheTtlSeconds(endpoint) * 1000),
      );

      await this.externalApiRequestLogRepository.createLog({
        provider,
        endpoint,
        cacheKey,
        requestUrl: response.requestUrl,
        statusCode: response.statusCode,
        durationMs,
        wasCached: false,
        wasSuccessful: true,
        errorMessage: null,
      });

      return {
        ...payload,
        source: 'provider',
      };
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const latestCache = await this.externalApiCacheRepository.findLatest(provider, endpoint, cacheKey);
      const errorMessage = error instanceof Error ? error.message : 'Unknown external provider error.';

      await this.externalApiRequestLogRepository.createLog({
        provider,
        endpoint,
        cacheKey,
        requestUrl: latestCache?.requestUrl ?? provider,
        statusCode: null,
        durationMs,
        wasCached: false,
        wasSuccessful: false,
        errorMessage,
      });

      if (latestCache) {
        return {
          ...(latestCache.responsePayload as T),
          source: 'stale-cache',
        };
      }

      throw error;
    }
  }

  private createCacheKey(provider: string, endpoint: string, cacheInput: Record<string, unknown>) {
    return createHash('sha256')
      .update(JSON.stringify({ provider, endpoint, cacheInput }))
      .digest('hex');
  }

  private async resolvePrimaryThenFallback(
    cacheInput: Record<string, unknown>,
    dto: GetCurrentWeatherDto,
  ) {
    try {
      const primary = await this.resolveWithCache(
        'openweathermap',
        'current_weather',
        cacheInput,
        async () => this.openWeatherMapClient.getCurrentWeather(dto.lat, dto.lng),
      );

      return {
        ...primary,
        provider: 'openweathermap',
      };
    } catch (error) {
      const fallback = await this.resolveWithCache(
        'openmeteo',
        'current_weather',
        cacheInput,
        async () => this.openMeteoClient.getCurrentWeather(dto.lat, dto.lng),
      );

      return {
        ...fallback,
        provider: 'openmeteo',
        fallbackReason: error instanceof Error ? error.message : 'OpenWeatherMap request failed.',
      };
    }
  }
}
