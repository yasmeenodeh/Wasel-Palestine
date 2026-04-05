import { PartialType } from '@nestjs/swagger';
import { CreateAlertSubscriptionDto } from './create-alert-subscription.dto';

export class UpdateAlertSubscriptionDto extends PartialType(CreateAlertSubscriptionDto) {}
