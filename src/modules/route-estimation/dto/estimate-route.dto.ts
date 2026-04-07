import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class EstimateRouteDto {
  @IsNumber()
  startLat!: number;

  @IsNumber()
  startLng!: number;

  @IsNumber()
  endLat!: number;

  @IsNumber()
  endLng!: number;

  @IsOptional()
  @IsBoolean()
  avoidCheckpoints?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  avoidAreas?: string[];
}