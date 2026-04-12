import { IsString, MaxLength, MinLength } from 'class-validator';

export class SearchLocationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  query!: string;
}
