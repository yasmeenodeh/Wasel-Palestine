import { IsInt, IsLatitude, IsLongitude, IsNotEmpty, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateReportDto {
  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;

  @IsInt()
  @Min(1)
  categoryId!: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  @IsString()
  reportedAt?: string;
}
