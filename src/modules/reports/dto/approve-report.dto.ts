import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveReportDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  actionNote?: string;
}
