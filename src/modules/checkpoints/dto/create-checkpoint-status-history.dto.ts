import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCheckpointStatusHistoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  newStatus!: string;

  @IsOptional()
  @IsString()
  changeNote?: string;
}
