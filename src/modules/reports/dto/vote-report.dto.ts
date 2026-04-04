import { IsIn } from 'class-validator';

export class VoteReportDto {
  @IsIn(['confirm', 'deny'])
  voteType!: 'confirm' | 'deny';
}
