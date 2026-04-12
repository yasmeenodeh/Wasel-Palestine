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
export class OpenMeteoClient {
  private readonly baseUrl = 'https://api.open-meteo.com/v1/forecast';

  constructor(private readonly externalProviderPolicyService: ExternalProviderPolicyService) {}

  async getCurrentWeather(lat: number, lng: number) {
    const requestUrl =
      `${this.baseUrl}?latitude=${lat}&longitude=${lng}`
      + '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,visibility,rain';
    const response = await this.request<{
      current?: {
        temperature_2m?: number;
        apparent_temperature?: number;
        weather_code?: number;
        wind_speed_10m?: number;
        visibility?: number;
        rain?: number;
      };
    }>(requestUrl);
    const weatherCode = response.data.current?.weather_code ?? -1;

    return {
      requestUrl: response.requestUrl,
      statusCode: response.statusCode,
      weather: {
        locationName: null,
        condition: this.mapWeatherCode(weatherCode).condition,
        description: this.mapWeatherCode(weatherCode).description,
        temperatureC: response.data.current?.temperature_2m ?? null,
        feelsLikeC: response.data.current?.apparent_temperature ?? null,
        windSpeedMps: response.data.current?.wind_speed_10m ?? null,
        rainVolumeMm: response.data.current?.rain ?? null,
        visibilityMeters: response.data.current?.visibility ?? null,
      },
    };
  }

  private mapWeatherCode(weatherCode: number) {
    if ([95, 96, 99].includes(weatherCode)) {
      return { condition: 'Thunderstorm', description: 'thunderstorm conditions' };
    }

    if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
      return { condition: 'Snow', description: 'snow or freezing precipitation' };
    }

    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
      return { condition: 'Rain', description: 'rain or drizzle conditions' };
    }

    if ([45, 48].includes(weatherCode)) {
      return { condition: 'Fog', description: 'foggy conditions' };
    }

    if ([1, 2, 3].includes(weatherCode)) {
      return { condition: 'Clouds', description: 'cloudy conditions' };
    }

    if (weatherCode === 0) {
      return { condition: 'Clear', description: 'clear sky' };
    }

    return { condition: 'Unknown', description: 'weather data unavailable' };
  }

  private async request<T>(requestUrl: string): Promise<ProviderResponse<T>> {
    const controller = new AbortController();
    const timeoutMs = this.externalProviderPolicyService.getTimeoutMs('openmeteo');
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(requestUrl, {
        method: 'GET',
        signal: controller.signal,
      });
      const responseBody = await response.text();
      const parsedBody = responseBody.length > 0 ? (JSON.parse(responseBody) as T) : ({} as T);

      if (!response.ok) {
        throw new BadGatewayException(`Open-Meteo request failed with status ${response.status}.`);
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
        throw new GatewayTimeoutException('Open-Meteo request timed out.');
      }

      if (error instanceof SyntaxError) {
        throw new BadGatewayException('Open-Meteo returned malformed JSON.');
      }

      throw new ServiceUnavailableException('Open-Meteo is currently unavailable.');
    } finally {
      clearTimeout(timeout);
    }
  }
}
