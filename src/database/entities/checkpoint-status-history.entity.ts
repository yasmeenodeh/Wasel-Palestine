import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CheckpointEntity } from './checkpoint.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'checkpoint_status_history' })
export class CheckpointStatusHistoryEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'checkpoint_id', type: 'bigint', unsigned: true })
  checkpointId!: string;

  @Column({ name: 'previous_status', type: 'varchar', length: 50, nullable: true })
  previousStatus!: string | null;

  @Column({ name: 'new_status', type: 'varchar', length: 50 })
  newStatus!: string;

  @Column({ name: 'changed_by', type: 'bigint', unsigned: true, nullable: true })
  changedBy!: string | null;

  @Column({ name: 'change_note', type: 'text', nullable: true })
  changeNote!: string | null;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamp' })
  changedAt!: Date;

  @ManyToOne(() => CheckpointEntity, (checkpoint) => checkpoint.statusHistory)
  @JoinColumn({ name: 'checkpoint_id' })
  checkpoint!: CheckpointEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'changed_by' })
  changedByUser!: UserEntity | null;
}
