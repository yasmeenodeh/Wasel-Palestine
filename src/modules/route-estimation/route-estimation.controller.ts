import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { RouteEstimationService } from './application/route-estimation.service';
import { EstimateRouteDto } from './dto/estimate-route.dto';
import { ListRouteEstimationsDto } from './dto/list-route-estimations.dto';

@Controller({ path: 'route-estimation', version: '1' })
export class RouteEstimationController {
  constructor(private readonly routeEstimationService: RouteEstimationService) {}

  @Get()
  list(@Query() query: ListRouteEstimationsDto) {
    return this.routeEstimationService.list(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.routeEstimationService.findOne(id.toString());
  }

  @Post('estimate')
  estimateRoute(@Body() dto: EstimateRouteDto) {
    return this.routeEstimationService.estimateRoute(dto);
  }

  @Post(':id/recalculate')
  recalculate(@Param('id', ParseIntPipe) id: number) {
    return this.routeEstimationService.recalculate(id.toString());
  }
}
