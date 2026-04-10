import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationResponseFactory } from '../../../common/application/pagination-response.factory';
import { CheckpointEntity } from '../../../database/entities/checkpoint.entity';
import { ListCheckpointsDto } from '../dto/list-checkpoints.dto';

@Injectable()
export class CheckpointsQueryRepository {
  constructor(
    @InjectRepository(CheckpointEntity)
    private readonly checkpointRepository: Repository<CheckpointEntity>,
  ) {}

  async list(query: ListCheckpointsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const sortBy = ['name', 'currentStatus', 'createdAt', 'updatedAt'].includes(query.sortBy ?? '')
      ? (query.sortBy as keyof CheckpointEntity)
      : 'updatedAt';
    const sortOrder = (query.sortOrder ?? 'DESC').toUpperCase() as 'ASC' | 'DESC';
    const qb = this.checkpointRepository.createQueryBuilder('checkpoint');

    if (query.status) {
      qb.andWhere('checkpoint.current_status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere('(checkpoint.name LIKE :search OR checkpoint.description LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [items, total] = await qb
      .orderBy(`checkpoint.${sortBy}`, sortOrder)
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return PaginationResponseFactory.create(items, page, limit, total);
  }
}
