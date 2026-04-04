import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListReportsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  submittedBy?: string;

  @IsOptional()
  @IsString()
  hasDuplicate?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
