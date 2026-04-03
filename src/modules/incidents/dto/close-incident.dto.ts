import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CloseIncidentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  changeReason?: string;
}
