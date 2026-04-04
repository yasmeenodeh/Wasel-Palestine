import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ConvertReportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsInt()
  @Min(1)
  severityId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  checkpointId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  actionNote?: string;
}
