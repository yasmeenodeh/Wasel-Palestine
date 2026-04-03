import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleHeaderGuard } from '../../common/guards/role-header.guard';
import { CheckpointStatusHistoryEntity } from '../../database/entities/checkpoint-status-history.entity';
import { CheckpointEntity } from '../../database/entities/checkpoint.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { CheckpointsController } from './checkpoints.controller';
import { CheckpointsService } from './checkpoints.service';

@Module({
  imports: [TypeOrmModule.forFeature([CheckpointEntity, CheckpointStatusHistoryEntity, UserEntity])],
  controllers: [CheckpointsController],
  providers: [CheckpointsService, RoleHeaderGuard],
  exports: [CheckpointsService],
})
export class CheckpointsModule {}
