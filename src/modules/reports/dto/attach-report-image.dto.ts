import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AttachReportImageDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  imageUrl!: string;

  @IsString()
  @IsIn(['accident', 'checkpoint', 'traffic'])
  mediaType!: 'accident' | 'checkpoint' | 'traffic';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  caption?: string;
}
