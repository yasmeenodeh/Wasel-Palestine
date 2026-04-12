import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ExternalProviderPolicyService } from '../domain/external-provider-policy.service';

type RouteDirectionsInput = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
};

type ProviderResponse<T> = {
  data: T;
  requestUrl: string;
  statusCode: number;
};

@Injectable()
export class OpenRouteServiceClient {
  private readonly baseUrl = 'https://api.openrouteservice.org';

  constructor(private readonly externalProviderPolicyService: ExternalProviderPolicyService) {}

  async getDirections(input: RouteDirectionsInput) {
    const requestUrl = `${this.baseUrl}/v2/directions/driving-car/json`;
    const response = await this.request<{
      routes?: Array<{
        summary?: {
          distance?: number;
          duration?: number;
        };
      }>;
    }>(requestUrl, {
      method: 'POST',
      headers: {
        Authorization: this.externalProviderPolicyService.getApiKey('openrouteservice'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coordinates: [
          [input.startLng, input.startLat],
          [input.endLng, input.endLat],
        ],
      }),
    });

    const summary = response.data.routes?.[0]?.summary;

    if (!summary?.distance || !summary?.duration) {
      throw new BadGatewayException('OpenRouteService returned an invalid directions response.');
    }

    return {
      requestUrl: response.requestUrl,
      statusCode: response.statusCode,
      route: {
        distanceKm: Number((summary.distance / 1000).toFixed(2)),
        durationMinutes: Math.max(1, Math.round(summary.duration / 60)),
      },
    };
  }

  async searchLocations(query: string) {
    const requestUrl = `${this.baseUrl}/geocode/search?text=${encodeURIComponent(query)}&size=5`;
    const response = await this.request<{
      features?: Array<{
        geometry?: { coordinates?: [number, number] };
        properties?: {
          label?: string;
          name?: string;
          country?: string;
          region?: string;
          locality?: string;
        };
      }>;
    }>(requestUrl, {
      method: 'GET',
      headers: {
        Authorization: this.externalProviderPolicyService.getApiKey('openrouteservice'),
      },
    });

    return {
      requestUrl: response.requestUrl,
      statusCode: response.statusCode,
      locations: (response.data.features ?? []).map((feature) => ({
        label: feature.properties?.label ?? feature.properties?.name ?? 'Unknown location',
        latitude: feature.geometry?.coordinates?.[1] ?? null,
        longitude: feature.geometry?.coordinates?.[0] ?? null,
        country: feature.properties?.country ?? null,
        region: feature.properties?.region ?? null,
        locality: feature.properties?.locality ?? null,
      })),
    };
  }

  private async request<T>(requestUrl: string, init: RequestInit): Promise<ProviderResponse<T>> {
    const controller = new AbortController();
    const timeoutMs = this.externalProviderPolicyService.getTimeoutMs('openrouteservice');
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(requestUrl, {
        ...init,
        signal: controller.signal,
      });
      const responseBody = await response.text();
      const parsedBody = responseBody.length > 0 ? (JSON.parse(responseBody) as T) : ({} as T);

      if (!response.ok) {
        throw new BadGatewayException(`OpenRouteService request failed with status ${response.status}.`);
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
        throw new GatewayTimeoutException('OpenRouteService request timed out.');
      }

      if (error instanceof SyntaxError) {
        throw new BadGatewayException('OpenRouteService returned malformed JSON.');
      }

      throw new ServiceUnavailableException('OpenRouteService is currently unavailable.');
    } finally {
      clearTimeout(timeout);
    }
  }
}
