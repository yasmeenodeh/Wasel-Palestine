import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleHeaderGuard } from '../../common/guards/role-header.guard';
import { CheckpointStatusHistoryEntity } from '../../database/entities/checkpoint-status-history.entity';
import { CheckpointEntity } from '../../database/entities/checkpoint.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { CheckpointsService } from './application/checkpoints.service';
import { CheckpointsController } from './checkpoints.controller';
import { CheckpointStatusHistoryService } from './domain/checkpoint-status-history.service';
import { CheckpointsQueryRepository } from './infrastructure/checkpoints-query.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CheckpointEntity, CheckpointStatusHistoryEntity, UserEntity])],
  controllers: [CheckpointsController],
  providers: [CheckpointsService, CheckpointsQueryRepository, CheckpointStatusHistoryService, RoleHeaderGuard],
  exports: [CheckpointsService],
})
export class CheckpointsModule {}
