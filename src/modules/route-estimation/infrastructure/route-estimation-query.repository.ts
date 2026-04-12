import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PaginationResponseFactory } from '../../../common/application/pagination-response.factory';
import { ListRouteEstimationsDto } from '../dto/list-route-estimations.dto';

type RouteEstimationFactorRawRecord = {
  id: string;
  routeEstimationId: string;
  factorType: string;
  description: string;
  delayMinutes: number;
  affectedCheckpointId: string | null;
  affectedIncidentId: string | null;
  createdAt: string;
  affectedCheckpoint_id: string | null;
  affectedCheckpoint_name: string | null;
  affectedCheckpoint_currentStatus: string | null;
  affectedCheckpoint_latitude: string | null;
  affectedCheckpoint_longitude: string | null;
  affectedIncident_id: string | null;
  affectedIncident_title: string | null;
  affectedIncident_description: string | null;
  affectedIncident_latitude: string | null;
  affectedIncident_longitude: string | null;
};

@Injectable()
export class RouteEstimationQueryRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async list(query: ListRouteEstimationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const sortFieldMap: Record<string, string> = {
      createdAt: 're.created_at',
      estimatedDistanceKm: 're.estimated_distance_km',
      estimatedDurationMinutes: 're.estimated_duration_minutes',
    };
    const sortBy = sortFieldMap[query.sortBy ?? ''] ?? 're.created_at';
    const sortOrder = (query.sortOrder ?? 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const whereParts: string[] = [];
    const params: Array<string | number> = [];

    if (query.factorType) {
      whereParts.push(
        `EXISTS (
          SELECT 1
          FROM route_estimation_factors ref
          WHERE ref.route_estimation_id = re.id
            AND ref.factor_type = ?
        )`,
      );
      params.push(query.factorType);
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    const data = await this.dataSource.query(
      `
        SELECT
          re.id,
          re.start_lat AS startLat,
          re.start_lng AS startLng,
          re.end_lat AS endLat,
          re.end_lng AS endLng,
          re.estimated_distance_km AS estimatedDistanceKm,
          re.estimated_duration_minutes AS estimatedDurationMinutes,
          re.base_duration_minutes AS baseDurationMinutes,
          re.constraints_delay_minutes AS constraintsDelayMinutes,
          re.mobility_delay_minutes AS mobilityDelayMinutes,
          re.route_provider AS routeProvider,
          re.route_provider_source AS routeProviderSource,
          re.weather_provider AS weatherProvider,
          re.weather_provider_source AS weatherProviderSource,
          re.metadata,
          re.created_at AS createdAt
        FROM route_estimations re
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset],
    );

    const [{ total }] = await this.dataSource.query(
      `
        SELECT COUNT(*) AS total
        FROM route_estimations re
        ${whereClause}
      `,
      params,
    );

    const routeIds = data.map((item: { id: string }) => item.id);
    const constraints = routeIds.length > 0
      ? await this.dataSource.query(
          `
            SELECT
              id,
              route_estimation_id AS routeEstimationId,
              constraint_type AS constraintType,
              value
            FROM route_estimation_constraints
            WHERE route_estimation_id IN (${routeIds.map(() => '?').join(', ')})
            ORDER BY id ASC
          `,
          routeIds,
        )
      : [];
    const factors = routeIds.length > 0
      ? await this.dataSource.query(
          `
            SELECT
              id,
              route_estimation_id AS routeEstimationId,
              factor_type AS factorType,
              description,
              delay_minutes AS delayMinutes,
              affected_checkpoint_id AS affectedCheckpointId,
              affected_incident_id AS affectedIncidentId,
              created_at AS createdAt
            FROM route_estimation_factors
            WHERE route_estimation_id IN (${routeIds.map(() => '?').join(', ')})
            ORDER BY id ASC
          `,
          routeIds,
        )
      : [];

    const hydrated = data.map((item: { id: string }) => ({
      ...item,
      constraints: constraints.filter(
        (constraint: { routeEstimationId: string }) => constraint.routeEstimationId === item.id,
      ),
      factors: factors.filter((factor: { routeEstimationId: string }) => factor.routeEstimationId === item.id),
    }));

    return PaginationResponseFactory.create(hydrated, page, limit, Number(total));
  }

  async findOne(id: string) {
    const [routeEstimation] = await this.dataSource.query(
      `
        SELECT
          re.id,
          re.start_lat AS startLat,
          re.start_lng AS startLng,
          re.end_lat AS endLat,
          re.end_lng AS endLng,
          re.estimated_distance_km AS estimatedDistanceKm,
          re.estimated_duration_minutes AS estimatedDurationMinutes,
          re.base_duration_minutes AS baseDurationMinutes,
          re.constraints_delay_minutes AS constraintsDelayMinutes,
          re.mobility_delay_minutes AS mobilityDelayMinutes,
          re.route_provider AS routeProvider,
          re.route_provider_source AS routeProviderSource,
          re.weather_provider AS weatherProvider,
          re.weather_provider_source AS weatherProviderSource,
          re.metadata,
          re.created_at AS createdAt
        FROM route_estimations re
        WHERE re.id = ?
      `,
      [id],
    );

    if (!routeEstimation) {
      throw new NotFoundException(`Route estimation ${id} was not found.`);
    }

    const constraints = await this.dataSource.query(
      `
        SELECT
          id,
          route_estimation_id AS routeEstimationId,
          constraint_type AS constraintType,
          value
        FROM route_estimation_constraints
        WHERE route_estimation_id = ?
        ORDER BY id ASC
      `,
      [id],
    );
    const factors = await this.dataSource.query(
      `
        SELECT
          ref.id,
          ref.route_estimation_id AS routeEstimationId,
          ref.factor_type AS factorType,
          ref.description,
          ref.delay_minutes AS delayMinutes,
          ref.affected_checkpoint_id AS affectedCheckpointId,
          ref.affected_incident_id AS affectedIncidentId,
          ref.created_at AS createdAt,
          checkpoint.id AS affectedCheckpoint_id,
          checkpoint.name AS affectedCheckpoint_name,
          checkpoint.current_status AS affectedCheckpoint_currentStatus,
          checkpoint.latitude AS affectedCheckpoint_latitude,
          checkpoint.longitude AS affectedCheckpoint_longitude,
          incident.id AS affectedIncident_id,
          incident.title AS affectedIncident_title,
          incident.description AS affectedIncident_description,
          incident.latitude AS affectedIncident_latitude,
          incident.longitude AS affectedIncident_longitude
        FROM route_estimation_factors ref
        LEFT JOIN checkpoints checkpoint ON checkpoint.id = ref.affected_checkpoint_id
        LEFT JOIN incidents incident ON incident.id = ref.affected_incident_id
        WHERE ref.route_estimation_id = ?
        ORDER BY ref.id ASC
      `,
      [id],
    );

    return {
      ...routeEstimation,
      constraints,
      factors: factors.map(
        (factor: RouteEstimationFactorRawRecord) => ({
          id: factor.id,
          routeEstimationId: factor.routeEstimationId,
          factorType: factor.factorType,
          description: factor.description,
          delayMinutes: factor.delayMinutes,
          affectedCheckpointId: factor.affectedCheckpointId,
          affectedIncidentId: factor.affectedIncidentId,
          createdAt: factor.createdAt,
          affectedCheckpoint: factor.affectedCheckpoint_id
            ? {
                id: factor.affectedCheckpoint_id,
                name: factor.affectedCheckpoint_name,
                currentStatus: factor.affectedCheckpoint_currentStatus,
                latitude: factor.affectedCheckpoint_latitude,
                longitude: factor.affectedCheckpoint_longitude,
              }
            : null,
          affectedIncident: factor.affectedIncident_id
            ? {
                id: factor.affectedIncident_id,
                title: factor.affectedIncident_title,
                description: factor.affectedIncident_description,
                latitude: factor.affectedIncident_latitude,
                longitude: factor.affectedIncident_longitude,
              }
            : null,
        }),
      ),
    };
  }
}
