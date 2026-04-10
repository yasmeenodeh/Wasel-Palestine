import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({ name: 'audit_logs' })
export class AuditLogEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'actor_user_id', type: 'bigint', unsigned: true, nullable: true })
  actorUserId!: string | null;

  @Column({
    name: 'action_type',
    type: 'enum',
    enum: [
      'create',
      'update',
      'verify',
      'close',
      'approve',
      'reject',
      'merge',
      'flag_abuse',
      'convert_to_incident',
    ],
  })
  actionType!:
    | 'create'
    | 'update'
    | 'verify'
    | 'close'
    | 'approve'
    | 'reject'
    | 'merge'
    | 'flag_abuse'
    | 'convert_to_incident';

  @Column({ name: 'entity_type', type: 'varchar', length: 50 })
  entityType!: string;

  @Column({ name: 'entity_id', type: 'bigint', unsigned: true })
  entityId!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'json', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'actor_user_id' })
  actorUser!: UserEntity | null;
}
