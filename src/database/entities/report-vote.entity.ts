import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReportEntity } from './report.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'report_votes' })
export class ReportVoteEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string;

  @Column({ name: 'report_id', type: 'bigint', unsigned: true })
  reportId!: string;

  @Column({ name: 'vote_type', type: 'enum', enum: ['confirm', 'deny'] })
  voteType!: 'confirm' | 'deny';

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @ManyToOne(() => ReportEntity, (report) => report.votes)
  @JoinColumn({ name: 'report_id' })
  report!: ReportEntity;
}
