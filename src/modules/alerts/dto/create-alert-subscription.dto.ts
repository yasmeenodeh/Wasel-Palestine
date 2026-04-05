import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateAlertSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  geographicArea!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;
}
