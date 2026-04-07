import { Body, Controller, Post } from '@nestjs/common';
import { RouteEstimationService } from './route-estimation.service';
import { EstimateRouteDto } from './dto/estimate-route.dto';

@Controller('route-estimation')
export class RouteEstimationController {
  constructor(private readonly routeEstimationService: RouteEstimationService) {}

  @Post('estimate')
  estimateRoute(@Body() dto: EstimateRouteDto) {
    return this.routeEstimationService.estimateRoute(dto);
  }
}