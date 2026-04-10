import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListAuditLogsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  actorUserId?: string;

  @IsOptional()
  @IsString()
  actionType?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;
}
