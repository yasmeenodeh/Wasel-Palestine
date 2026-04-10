import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidentCategoryEntity } from '../../../database/entities/incident-category.entity';
import { IncidentSeverityEntity } from '../../../database/entities/incident-severity.entity';
import { IncidentStatusEntity } from '../../../database/entities/incident-status.entity';
import { RoleEntity } from '../../../database/entities/role.entity';

@Injectable()
export class ReferenceDataService {
  constructor(
    @InjectRepository(IncidentCategoryEntity)
    private readonly incidentCategoryRepository: Repository<IncidentCategoryEntity>,
    @InjectRepository(IncidentSeverityEntity)
    private readonly incidentSeverityRepository: Repository<IncidentSeverityEntity>,
    @InjectRepository(IncidentStatusEntity)
    private readonly incidentStatusRepository: Repository<IncidentStatusEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  listIncidentCategories() {
    return this.incidentCategoryRepository.find({
      order: { name: 'ASC' },
    });
  }

  listIncidentSeverities() {
    return this.incidentSeverityRepository.find({
      order: { rankOrder: 'ASC' },
    });
  }

  listIncidentStatuses() {
    return this.incidentStatusRepository.find({
      order: { name: 'ASC' },
    });
  }

  listRoles() {
    return this.roleRepository.find({
      order: { name: 'ASC' },
    });
  }
}
