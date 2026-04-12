import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ExternalProviderPolicyService } from '../domain/external-provider-policy.service';

type ProviderResponse<T> = {
  data: T;
  requestUrl: string;
  statusCode: number;
};

@Injectable()
export class OpenWeatherMapClient {
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor(private readonly externalProviderPolicyService: ExternalProviderPolicyService) {}

  async getCurrentWeather(lat: number, lng: number) {
    const apiKey = this.externalProviderPolicyService.getApiKey('openweathermap');
    const requestUrl = `${this.baseUrl}/weather?lat=${lat}&lon=${lng}&appid=${encodeURIComponent(apiKey)}&units=metric`;
    const response = await this.request<{
      weather?: Array<{ main?: string; description?: string }>;
      main?: { temp?: number; feels_like?: number };
      wind?: { speed?: number };
      rain?: { '1h'?: number };
      visibility?: number;
      name?: string;
    }>(requestUrl);

    return {
      requestUrl: `${this.baseUrl}/weather?lat=${lat}&lon=${lng}&units=metric`,
      statusCode: response.statusCode,
      weather: {
        locationName: response.data.name ?? null,
        condition: response.data.weather?.[0]?.main ?? 'Unknown',
        description: response.data.weather?.[0]?.description ?? 'Unknown conditions',
        temperatureC: response.data.main?.temp ?? null,
        feelsLikeC: response.data.main?.feels_like ?? null,
        windSpeedMps: response.data.wind?.speed ?? null,
        rainVolumeMm: response.data.rain?.['1h'] ?? null,
        visibilityMeters: response.data.visibility ?? null,
      },
    };
  }

  private async request<T>(requestUrl: string): Promise<ProviderResponse<T>> {
    const controller = new AbortController();
    const timeoutMs = this.externalProviderPolicyService.getTimeoutMs('openweathermap');
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(requestUrl, {
        method: 'GET',
        signal: controller.signal,
      });
      const responseBody = await response.text();
      const parsedBody = responseBody.length > 0 ? (JSON.parse(responseBody) as T) : ({} as T);

      if (!response.ok) {
        throw new BadGatewayException(`OpenWeatherMap request failed with status ${response.status}.`);
      }

      return {
        data: parsedBody,
        requestUrl,
        statusCode: response.status,
      };
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new GatewayTimeoutException('OpenWeatherMap request timed out.');
      }

      if (error instanceof SyntaxError) {
        throw new BadGatewayException('OpenWeatherMap returned malformed JSON.');
      }

      throw new ServiceUnavailableException('OpenWeatherMap is currently unavailable.');
    } finally {
      clearTimeout(timeout);
    }
  }
}
