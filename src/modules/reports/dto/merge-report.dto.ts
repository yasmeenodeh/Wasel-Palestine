import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class MergeReportDto {
  @IsString()
  @IsNotEmpty()
  targetReportId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  actionNote?: string;
}
