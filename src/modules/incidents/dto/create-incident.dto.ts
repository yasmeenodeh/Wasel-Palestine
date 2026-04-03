import {
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateIncidentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;

  @IsInt()
  @Min(1)
  categoryId!: number;

  @IsInt()
  @Min(1)
  severityId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  checkpointId?: number;
}
