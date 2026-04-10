import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidentStatusEntity } from '../../../database/entities/incident-status.entity';

type StatusSeedName = 'pending' | 'verified' | 'closed';

@Injectable()
export class IncidentStatusService {
  constructor(
    @InjectRepository(IncidentStatusEntity)
    private readonly incidentStatusRepository: Repository<IncidentStatusEntity>,
  ) {}

  async findByName(name: StatusSeedName) {
    const status = await this.incidentStatusRepository.findOne({
      where: { name },
    });

    if (!status) {
      throw new NotFoundException(`Required incident status "${name}" was not found in seed data.`);
    }

    return status;
  }
}
