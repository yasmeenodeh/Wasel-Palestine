import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckpointStatusHistoryEntity } from '../../../database/entities/checkpoint-status-history.entity';

@Injectable()
export class CheckpointStatusHistoryService {
  constructor(
    @InjectRepository(CheckpointStatusHistoryEntity)
    private readonly checkpointStatusHistoryRepository: Repository<CheckpointStatusHistoryEntity>,
  ) {}

  create(
    checkpointId: string,
    previousStatus: string | null,
    newStatus: string,
    actorUserId?: number,
    changeNote?: string | null,
  ) {
    return this.checkpointStatusHistoryRepository.save(
      this.checkpointStatusHistoryRepository.create({
        checkpointId,
        previousStatus,
        newStatus,
        changedBy: actorUserId ? actorUserId.toString() : null,
        changeNote: changeNote ?? null,
      }),
    );
  }

  list(checkpointId: string) {
    return this.checkpointStatusHistoryRepository.find({
      where: { checkpointId },
      order: { changedAt: 'DESC' },
    });
  }
}
