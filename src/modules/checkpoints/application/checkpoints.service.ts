import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckpointEntity } from '../../../database/entities/checkpoint.entity';
import { CreateCheckpointDto } from '../dto/create-checkpoint.dto';
import { CreateCheckpointStatusHistoryDto } from '../dto/create-checkpoint-status-history.dto';
import { ListCheckpointsDto } from '../dto/list-checkpoints.dto';
import { UpdateCheckpointDto } from '../dto/update-checkpoint.dto';
import { CheckpointStatusHistoryService } from '../domain/checkpoint-status-history.service';
import { CheckpointsQueryRepository } from '../infrastructure/checkpoints-query.repository';

@Injectable()
export class CheckpointsService {
  constructor(
    @InjectRepository(CheckpointEntity)
    private readonly checkpointRepository: Repository<CheckpointEntity>,
    private readonly checkpointsQueryRepository: CheckpointsQueryRepository,
    private readonly checkpointStatusHistoryService: CheckpointStatusHistoryService,
  ) {}

  list(query: ListCheckpointsDto) {
    return this.checkpointsQueryRepository.list(query);
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

    await this.checkpointStatusHistoryService.create(
      savedCheckpoint.id,
      null,
      dto.currentStatus,
      actorUserId,
      'Initial checkpoint status',
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
      await this.checkpointStatusHistoryService.create(
        id,
        checkpoint.currentStatus,
        dto.currentStatus,
        actorUserId,
        'Checkpoint status updated from checkpoint endpoint',
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

    return this.checkpointStatusHistoryService.create(
      checkpointId,
      previousStatus,
      dto.newStatus,
      actorUserId,
      dto.changeNote,
    );
  }

  async getStatusHistory(checkpointId: string) {
    await this.findOne(checkpointId);
    return this.checkpointStatusHistoryService.list(checkpointId);
  }

  async remove(id: string) {
    const checkpoint = await this.findOne(id);
    await this.checkpointRepository.remove(checkpoint);

    return {
      id,
      deleted: true,
    };
  }
}
