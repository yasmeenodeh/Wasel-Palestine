import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type ExternalProvider = 'openrouteservice' | 'openweathermap' | 'openmeteo';
type ExternalEndpoint = 'directions' | 'geocode_search' | 'current_weather';

@Injectable()
export class ExternalProviderPolicyService {
  constructor(private readonly configService: ConfigService) {}

  getApiKey(provider: ExternalProvider) {
    if (provider === 'openmeteo') {
      return '';
    }

    const envName =
      provider === 'openrouteservice' ? 'OPENROUTESERVICE_API_KEY' : 'OPENWEATHERMAP_API_KEY';
    const apiKey = this.configService.get<string>(envName)?.trim();

    if (!apiKey) {
      throw new ServiceUnavailableException(`${provider} API key is not configured.`);
    }

    return apiKey;
  }

  getTimeoutMs(provider: ExternalProvider) {
    const envName =
      provider === 'openrouteservice'
        ? 'OPENROUTESERVICE_TIMEOUT_MS'
        : provider === 'openweathermap'
          ? 'OPENWEATHERMAP_TIMEOUT_MS'
          : 'OPENMETEO_TIMEOUT_MS';
    return Number(this.configService.get<string>(envName, '8000'));
  }

  getRateLimitPerMinute(provider: ExternalProvider) {
    const envName =
      provider === 'openrouteservice'
        ? 'OPENROUTESERVICE_RATE_LIMIT_PER_MINUTE'
        : provider === 'openweathermap'
          ? 'OPENWEATHERMAP_RATE_LIMIT_PER_MINUTE'
          : 'OPENMETEO_RATE_LIMIT_PER_MINUTE';

    return Number(
      this.configService.get<string>(
        envName,
        provider === 'openrouteservice' ? '30' : provider === 'openweathermap' ? '60' : '120',
      ),
    );
  }

  getCacheTtlSeconds(endpoint: ExternalEndpoint) {
    if (endpoint === 'directions') {
      return Number(this.configService.get<string>('EXTERNAL_ROUTE_CACHE_TTL_SECONDS', '900'));
    }

    if (endpoint === 'geocode_search') {
      return Number(this.configService.get<string>('EXTERNAL_GEOCODE_CACHE_TTL_SECONDS', '86400'));
    }

    return Number(this.configService.get<string>('EXTERNAL_WEATHER_CACHE_TTL_SECONDS', '600'));
  }
}
