import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { AlertSubscriptionEntity } from '../../database/entities/alert-subscription.entity';
import { AlertEntity } from '../../database/entities/alert.entity';
import { IncidentEntity } from '../../database/entities/incident.entity';
import { CreateAlertSubscriptionDto } from './dto/create-alert-subscription.dto';
import { ListAlertsDto } from './dto/list-alerts.dto';
import { ListAlertSubscriptionsDto } from './dto/list-alert-subscriptions.dto';
import { UpdateAlertSubscriptionDto } from './dto/update-alert-subscription.dto';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(AlertSubscriptionEntity)
    private readonly alertSubscriptionRepository: Repository<AlertSubscriptionEntity>,
    @InjectRepository(AlertEntity)
    private readonly alertRepository: Repository<AlertEntity>,
    @InjectRepository(IncidentEntity)
    private readonly incidentRepository: Repository<IncidentEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
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
      .orderBy('subscription.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async listAlerts(query: ListAlertsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const whereParts: string[] = [];
    const params: Array<string | number> = [];

    if (query.userId) {
      whereParts.push('s.user_id = ?');
      params.push(query.userId);
    }

    if (query.status) {
      whereParts.push('a.status = ?');
      params.push(query.status);
    }

    if (query.incidentId) {
      whereParts.push('a.incident_id = ?');
      params.push(query.incidentId);
    }

    const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const data = await this.dataSource.query(
      `
        SELECT
          a.id,
          a.subscription_id AS subscriptionId,
          a.incident_id AS incidentId,
          a.alert_type AS alertType,
          a.status,
          a.payload,
          a.created_at AS createdAt,
          a.sent_at AS sentAt,
          s.user_id AS userId,
          s.geographic_area AS geographicArea,
          s.category_id AS categoryId
        FROM alerts a
        INNER JOIN alert_subscriptions s ON s.id = a.subscription_id
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset],
    );

    const [{ total }] = await this.dataSource.query(
      `
        SELECT COUNT(*) AS total
        FROM alerts a
        INNER JOIN alert_subscriptions s ON s.id = a.subscription_id
        ${whereClause}
      `,
      params,
    );

    return {
      data,
      meta: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
    };
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
      const matchesGeographicArea = this.matchesGeographicArea(
        subscription.geographicArea,
        Number(incident.latitude),
        Number(incident.longitude),
      );

      return matchesCategory && matchesGeographicArea;
    });

    if (matchedSubscriptions.length === 0) {
      return [];
    }

    const createdAlerts: AlertEntity[] = [];

    for (const subscription of matchedSubscriptions) {
      const existing = await this.alertRepository.findOne({
        where: {
          subscriptionId: subscription.id,
          incidentId,
        },
      });

      if (existing) {
        createdAlerts.push(existing);
        continue;
      }

      const alert = this.alertRepository.create({
        subscriptionId: subscription.id,
        incidentId,
        alertType: 'verified_incident',
        status: 'pending',
        payload: {
          incidentId,
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

      createdAlerts.push(await this.alertRepository.save(alert));
    }

    return createdAlerts;
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

  private matchesGeographicArea(geographicArea: string, latitude: number, longitude: number) {
    const normalized = geographicArea.trim().toLowerCase();

    if (normalized === 'all') {
      return true;
    }

    const circleMatch = normalized.match(/^circle:([-0-9.]+),([-0-9.]+),([0-9.]+)$/);

    if (circleMatch) {
      const centerLat = Number(circleMatch[1]);
      const centerLng = Number(circleMatch[2]);
      const radiusKm = Number(circleMatch[3]);
      const distanceKm = this.calculateDistanceKm(centerLat, centerLng, latitude, longitude);
      return distanceKm <= radiusKm;
    }

    const boxMatch = normalized.match(/^bbox:([-0-9.]+),([-0-9.]+),([-0-9.]+),([-0-9.]+)$/);

    if (boxMatch) {
      const minLat = Number(boxMatch[1]);
      const minLng = Number(boxMatch[2]);
      const maxLat = Number(boxMatch[3]);
      const maxLng = Number(boxMatch[4]);
      return latitude >= minLat && latitude <= maxLat && longitude >= minLng && longitude <= maxLng;
    }

    return false;
  }

  private calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }
}
