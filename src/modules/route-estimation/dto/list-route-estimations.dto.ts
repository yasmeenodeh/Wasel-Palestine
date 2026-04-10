import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListRouteEstimationsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  factorType?: string;
}
