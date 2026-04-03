import { IsLatitude, IsLongitude, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCheckpointDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  currentStatus!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
