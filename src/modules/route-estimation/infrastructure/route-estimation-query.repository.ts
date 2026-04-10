import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationResponseFactory } from '../../../common/application/pagination-response.factory';
import { RouteEstimationEntity } from '../../../database/entities/route-estimation.entity';
import { ListRouteEstimationsDto } from '../dto/list-route-estimations.dto';

@Injectable()
export class RouteEstimationQueryRepository {
  constructor(
    @InjectRepository(RouteEstimationEntity)
    private readonly routeEstimationRepository: Repository<RouteEstimationEntity>,
  ) {}

  async list(query: ListRouteEstimationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const sortBy = ['createdAt', 'estimatedDistanceKm', 'estimatedDurationMinutes'].includes(query.sortBy ?? '')
      ? (query.sortBy as keyof RouteEstimationEntity)
      : 'createdAt';
    const sortOrder = (query.sortOrder ?? 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const qb = this.routeEstimationRepository
      .createQueryBuilder('routeEstimation')
      .leftJoinAndSelect('routeEstimation.constraints', 'constraint')
      .leftJoinAndSelect('routeEstimation.factors', 'factor');

    if (query.factorType) {
      qb.andWhere('factor.factor_type = :factorType', { factorType: query.factorType });
    }

    const [data, total] = await qb
      .orderBy(`routeEstimation.${sortBy}`, sortOrder)
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return PaginationResponseFactory.create(data, page, limit, total);
  }

  async findOne(id: string) {
    const routeEstimation = await this.routeEstimationRepository.findOne({
      where: { id },
      relations: {
        constraints: true,
        factors: {
          affectedCheckpoint: true,
          affectedIncident: true,
        },
      },
    });

    if (!routeEstimation) {
      throw new NotFoundException(`Route estimation ${id} was not found.`);
    }

    return routeEstimation;
  }
}
