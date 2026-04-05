import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RoleHeaderGuard } from '../../common/guards/role-header.guard';
import { CreateAlertSubscriptionDto } from './dto/create-alert-subscription.dto';
import { ListAlertsDto } from './dto/list-alerts.dto';
import { ListAlertSubscriptionsDto } from './dto/list-alert-subscriptions.dto';
import { UpdateAlertSubscriptionDto } from './dto/update-alert-subscription.dto';
import { AlertsService } from './alerts.service';

type RequestWithUser = {
  user?: {
    id: number;
  };
};

@Controller({ path: 'alerts', version: '1' })
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get('subscriptions')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CITIZEN)
  listSubscriptions(@Query() query: ListAlertSubscriptionsDto) {
    return this.alertsService.listSubscriptions(query);
  }

  @Post('subscriptions')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CITIZEN)
  createSubscription(@Body() dto: CreateAlertSubscriptionDto, @Req() req: RequestWithUser) {
    return this.alertsService.createSubscription(dto, req.user?.id ?? 0);
  }

  @Patch('subscriptions/:id')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CITIZEN)
  updateSubscription(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAlertSubscriptionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.alertsService.updateSubscription(id.toString(), dto, req.user?.id ?? 0);
  }

  @Post('subscriptions/:id/deactivate')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CITIZEN)
  deactivateSubscription(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.alertsService.deactivateSubscription(id.toString(), req.user?.id ?? 0);
  }

  @Post('subscriptions/:id/reactivate')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CITIZEN)
  reactivateSubscription(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.alertsService.reactivateSubscription(id.toString(), req.user?.id ?? 0);
  }

  @Get()
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CITIZEN)
  listAlerts(@Query() query: ListAlertsDto) {
    return this.alertsService.listAlerts(query);
  }

  @Post(':id/read')
  @UseGuards(RoleHeaderGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.CITIZEN)
  markAsRead(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.alertsService.markAsRead(id.toString(), req.user?.id ?? 0);
  }
}
