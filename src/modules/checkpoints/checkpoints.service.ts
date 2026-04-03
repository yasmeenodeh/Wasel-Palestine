import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckpointStatusHistoryEntity } from '../../database/entities/checkpoint-status-history.entity';
import { CheckpointEntity } from '../../database/entities/checkpoint.entity';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { CreateCheckpointStatusHistoryDto } from './dto/create-checkpoint-status-history.dto';
import { ListCheckpointsDto } from './dto/list-checkpoints.dto';
import { UpdateCheckpointDto } from './dto/update-checkpoint.dto';

@Injectable()
export class CheckpointsService {
  constructor(
    @InjectRepository(CheckpointEntity)
    private readonly checkpointRepository: Repository<CheckpointEntity>,
    @InjectRepository(CheckpointStatusHistoryEntity)
    private readonly checkpointStatusHistoryRepository: Repository<CheckpointStatusHistoryEntity>,
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

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(dto: CreateCheckpointDto, actorUserId?: number) {
    const checkpoint = this.checkpointRepository.create({
      name: dto.name,
      latitude: dto.latitude.toString(),
      longitude: dto.longitude.toString(),
      currentStatus: dto.currentStatus,
      description: dto.description ?? null,
      createdBy: actorUserId ? actorUserId.toString() : null,
      updatedBy: actorUserId ? actorUserId.toString() : null,
    });

    const savedCheckpoint = await this.checkpointRepository.save(checkpoint);

    await this.checkpointStatusHistoryRepository.save(
      this.checkpointStatusHistoryRepository.create({
        checkpointId: savedCheckpoint.id,
        previousStatus: null,
        newStatus: dto.currentStatus,
        changedBy: actorUserId ? actorUserId.toString() : null,
        changeNote: 'Initial checkpoint status',
      }),
    );

    return this.findOne(savedCheckpoint.id);
  }

  async findOne(id: string) {
    const checkpoint = await this.checkpointRepository.findOne({
      where: { id },
    });

    if (!checkpoint) {
      throw new NotFoundException(`Checkpoint ${id} was not found.`);
    }

    return checkpoint;
  }

  async update(id: string, dto: UpdateCheckpointDto, actorUserId?: number) {
    const checkpoint = await this.findOne(id);

    if (dto.name !== undefined) checkpoint.name = dto.name;
    if (dto.latitude !== undefined) checkpoint.latitude = dto.latitude.toString();
    if (dto.longitude !== undefined) checkpoint.longitude = dto.longitude.toString();
    if (dto.description !== undefined) checkpoint.description = dto.description ?? null;

    if (dto.currentStatus && dto.currentStatus !== checkpoint.currentStatus) {
      await this.addStatusHistory(
        id,
        {
          newStatus: dto.currentStatus,
          changeNote: 'Checkpoint status updated from checkpoint endpoint',
        },
        actorUserId,
      );
      checkpoint.currentStatus = dto.currentStatus;
    }

    checkpoint.updatedBy = actorUserId ? actorUserId.toString() : checkpoint.updatedBy;
    await this.checkpointRepository.save(checkpoint);

    return this.findOne(id);
  }

  async addStatusHistory(
    checkpointId: string,
    dto: CreateCheckpointStatusHistoryDto,
    actorUserId?: number,
  ) {
    const checkpoint = await this.findOne(checkpointId);
    const previousStatus = checkpoint.currentStatus;

    checkpoint.currentStatus = dto.newStatus;
    checkpoint.updatedBy = actorUserId ? actorUserId.toString() : checkpoint.updatedBy;
    await this.checkpointRepository.save(checkpoint);

    return this.checkpointStatusHistoryRepository.save(
      this.checkpointStatusHistoryRepository.create({
        checkpointId,
        previousStatus,
        newStatus: dto.newStatus,
        changedBy: actorUserId ? actorUserId.toString() : null,
        changeNote: dto.changeNote ?? null,
      }),
    );
  }

  async getStatusHistory(checkpointId: string) {
    await this.findOne(checkpointId);

    return this.checkpointStatusHistoryRepository.find({
      where: { checkpointId },
      order: { changedAt: 'DESC' },
    });
  }
}
