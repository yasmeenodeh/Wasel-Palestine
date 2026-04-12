import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude } from 'class-validator';

export class GetCurrentWeatherDto {
  @Type(() => Number)
  @IsLatitude()
  lat!: number;

  @Type(() => Number)
  @IsLongitude()
  lng!: number;
}
