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

@Entity({ name: 'user_points_ledger' })
export class UserPointsLedgerEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string;

  @Column({ name: 'report_id', type: 'bigint', unsigned: true, nullable: true })
  reportId!: string | null;

  @Column({
    name: 'action_type',
    type: 'enum',
    enum: ['report_approved', 'report_converted', 'trusted_report_bonus'],
  })
  actionType!: 'report_approved' | 'report_converted' | 'trusted_report_bonus';

  @Column({ type: 'int' })
  points!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @ManyToOne(() => ReportEntity, { nullable: true })
  @JoinColumn({ name: 'report_id' })
  report!: ReportEntity | null;
}
