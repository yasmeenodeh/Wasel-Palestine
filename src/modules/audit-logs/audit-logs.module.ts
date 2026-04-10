import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleHeaderGuard } from '../../common/guards/role-header.guard';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';
import { AuditLogsService } from './application/audit-logs.service';
import { AuditLogsController } from './audit-logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, RoleHeaderGuard],
})
export class AuditLogsModule {}
