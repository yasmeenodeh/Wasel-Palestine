import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RoleHeaderGuard } from '../../common/guards/role-header.guard';
import { AuditLogsService } from './application/audit-logs.service';
import { ListAuditLogsDto } from './dto/list-audit-logs.dto';

@Controller({ path: 'audit-logs', version: '1' })
@UseGuards(RoleHeaderGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  list(@Query() query: ListAuditLogsDto) {
    return this.auditLogsService.list(query);
  }
}
