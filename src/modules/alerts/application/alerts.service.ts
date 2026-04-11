import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PaginationResponseFactory } from '../../../common/application/pagination-response.factory';
import { AlertSubscriptionEntity } from '../../../database/entities/alert-subscription.entity';
import { AlertEntity } from '../../../database/entities/alert.entity';
import { IncidentEntity } from '../../../database/entities/incident.entity';
import { CreateAlertSubscriptionDto } from '../dto/create-alert-subscription.dto';
import { ListAlertsDto } from '../dto/list-alerts.dto';
import { ListAlertSubscriptionsDto } from '../dto/list-alert-subscriptions.dto';
import { UpdateAlertSubscriptionDto } from '../dto/update-alert-subscription.dto';
import { AlertGeographyService } from '../domain/alert-geography.service';
import { AlertsQueryRepository } from '../infrastructure/alerts-query.repository';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(AlertSubscriptionEntity)
    private readonly alertSubscriptionRepository: Repository<AlertSubscriptionEntity>,
    @InjectRepository(AlertEntity)
    private readonly alertRepository: Repository<AlertEntity>,
    @InjectRepository(IncidentEntity)
    private readonly incidentRepository: Repository<IncidentEntity>,
    private readonly alertsQueryRepository: AlertsQueryRepository,
    private readonly alertGeographyService: AlertGeographyService,
  ) {}

  async listSubscriptions(query: ListAlertSubscriptionsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const qb = this.alertSubscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.category', 'category')
      .leftJoinAndSelect('subscription.user', 'user');

    if (query.userId) {
      qb.andWhere('subscription.user_id = :userId', { userId: query.userId });
    }

    if (query.categoryId) {
      qb.andWhere('subscription.category_id = :categoryId', { categoryId: query.categoryId });
    }

    if (query.isActive === 'true') {
      qb.andWhere('subscription.is_active = 1');
    }

    if (query.isActive === 'false') {
      qb.andWhere('subscription.is_active = 0');
    }

    const [data, total] = await qb
      .orderBy('subscription.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return PaginationResponseFactory.create(data, page, limit, total);
  }

  listAlerts(query: ListAlertsDto) {
    return this.alertsQueryRepository.list(query);
  }

  async createSubscription(dto: CreateAlertSubscriptionDto, actorUserId: number) {
    const existing = await this.alertSubscriptionRepository.findOne({
      where: {
        userId: actorUserId.toString(),
        geographicArea: dto.geographicArea.trim(),
        categoryId: dto.categoryId ? dto.categoryId.toString() : IsNull(),
      },
    });

    if (existing) {
      throw new BadRequestException('A matching alert subscription already exists.');
    }

    const subscription = this.alertSubscriptionRepository.create({
      userId: actorUserId.toString(),
      geographicArea: dto.geographicArea.trim(),
      categoryId: dto.categoryId ? dto.categoryId.toString() : null,
      isActive: true,
    });

    return this.alertSubscriptionRepository.save(subscription);
  }

  async updateSubscription(id: string, dto: UpdateAlertSubscriptionDto, actorUserId: number) {
    const subscription = await this.findSubscription(id);

    if (subscription.userId !== actorUserId.toString()) {
      throw new BadRequestException('You can only update your own alert subscriptions.');
    }

    if (dto.geographicArea !== undefined) {
      subscription.geographicArea = dto.geographicArea.trim();
    }

    if (dto.categoryId !== undefined) {
      subscription.categoryId = dto.categoryId ? dto.categoryId.toString() : null;
    }

    return this.alertSubscriptionRepository.save(subscription);
  }

  async deactivateSubscription(id: string, actorUserId: number) {
    const subscription = await this.findSubscription(id);

    if (subscription.userId !== actorUserId.toString()) {
      throw new BadRequestException('You can only deactivate your own alert subscriptions.');
    }

    subscription.isActive = false;
    return this.alertSubscriptionRepository.save(subscription);
  }

  async reactivateSubscription(id: string, actorUserId: number) {
    const subscription = await this.findSubscription(id);

    if (subscription.userId !== actorUserId.toString()) {
      throw new BadRequestException('You can only reactivate your own alert subscriptions.');
    }

    subscription.isActive = true;
    return this.alertSubscriptionRepository.save(subscription);
  }

  async markAsRead(id: string, actorUserId: number) {
    const alert = await this.alertRepository.findOne({
      where: { id },
      relations: {
        subscription: true,
      },
    });

    if (!alert) {
      throw new NotFoundException(`Alert ${id} was not found.`);
    }

    if (alert.subscription.userId !== actorUserId.toString()) {
      throw new BadRequestException('You can only update your own alerts.');
    }

    alert.status = 'read';
    alert.sentAt = alert.sentAt ?? new Date();
    return this.alertRepository.save(alert);
  }

  async createAlertsForVerifiedIncident(incidentId: string) {
    const incident = await this.incidentRepository.findOne({
      where: { id: incidentId },
      relations: {
        category: true,
        status: true,
        checkpoint: true,
      },
    });

    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} was not found.`);
    }

    const subscriptions = await this.alertSubscriptionRepository.find({
      where: {
        isActive: true,
      },
      relations: {
        category: true,
      },
    });

    const matchedSubscriptions = subscriptions.filter((subscription) => {
      const matchesCategory =
        subscription.categoryId === null || subscription.categoryId === incident.categoryId;

      return (
        matchesCategory &&
        this.alertGeographyService.matches(
          subscription.geographicArea,
          Number(incident.latitude),
          Number(incident.longitude),
        )
      );
    });

    const alerts = await Promise.all(
      matchedSubscriptions.map((subscription) => this.createIncidentAlert(subscription, incident)),
    );

    return alerts.filter((alert): alert is AlertEntity => alert !== null);
  }

  private async createIncidentAlert(
    subscription: AlertSubscriptionEntity,
    incident: IncidentEntity,
  ): Promise<AlertEntity | null> {
    const existing = await this.alertRepository.findOne({
      where: {
        subscriptionId: subscription.id,
        incidentId: incident.id,
      },
    });

    if (existing) {
      return existing;
    }

    const alert = this.alertRepository.create({
      subscriptionId: subscription.id,
      incidentId: incident.id,
      alertType: 'verified_incident',
      status: 'pending',
      payload: {
        incidentId: incident.id,
        title: incident.title,
        category: incident.category.name,
        geographicArea: subscription.geographicArea,
        severityId: incident.severityId,
        checkpointId: incident.checkpointId,
        latitude: incident.latitude,
        longitude: incident.longitude,
        verifiedAt: incident.verifiedAt,
      },
      sentAt: null,
    });

    return this.alertRepository.save(alert);
  }

  private async findSubscription(id: string) {
    const subscription = await this.alertSubscriptionRepository.findOne({
      where: { id },
      relations: {
        category: true,
        user: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Alert subscription ${id} was not found.`);
    }

    return subscription;
  }
}
