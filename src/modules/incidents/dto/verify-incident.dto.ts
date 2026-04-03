import { IsOptional, IsString } from 'class-validator';

export class VerifyIncidentDto {
  @IsOptional()
  @IsString()
  changeReason?: string;
}
