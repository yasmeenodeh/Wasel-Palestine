import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentCategoryEntity } from '../../database/entities/incident-category.entity';
import { IncidentSeverityEntity } from '../../database/entities/incident-severity.entity';
import { IncidentStatusEntity } from '../../database/entities/incident-status.entity';
import { RoleEntity } from '../../database/entities/role.entity';
import { ReferenceDataService } from './application/reference-data.service';
import { ReferenceDataController } from './reference-data.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IncidentCategoryEntity,
      IncidentSeverityEntity,
      IncidentStatusEntity,
      RoleEntity,
    ]),
  ],
  controllers: [ReferenceDataController],
  providers: [ReferenceDataService],
})
export class ReferenceDataModule {}
