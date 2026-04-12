import { Controller, Get, Query } from '@nestjs/common';
import { ExternalIntelligenceService } from './application/external-intelligence.service';
import { GetCurrentWeatherDto } from './dto/get-current-weather.dto';
import { SearchLocationDto } from './dto/search-location.dto';

@Controller({ path: 'external-intelligence', version: '1' })
export class ExternalIntelligenceController {
  constructor(private readonly externalIntelligenceService: ExternalIntelligenceService) {}

  @Get('geocode/search')
  searchLocations(@Query() query: SearchLocationDto) {
    return this.externalIntelligenceService.searchLocations(query);
  }

  @Get('weather/current')
  getCurrentWeather(@Query() query: GetCurrentWeatherDto) {
    return this.externalIntelligenceService.getCurrentWeather(query);
  }
}
