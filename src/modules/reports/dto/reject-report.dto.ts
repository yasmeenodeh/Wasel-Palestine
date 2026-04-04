import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectReportDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  actionNote?: string;
}
