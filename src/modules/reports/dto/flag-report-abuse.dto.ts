import { IsOptional, IsString, MaxLength } from 'class-validator';

export class FlagReportAbuseDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  actionNote?: string;
}
