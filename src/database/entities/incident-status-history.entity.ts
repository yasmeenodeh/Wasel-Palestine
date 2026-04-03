import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IncidentEntity } from './incident.entity';
import { IncidentStatusEntity } from './incident-status.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'incident_status_history' })
export class IncidentStatusHistoryEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'incident_id', type: 'bigint', unsigned: true })
  incidentId!: string;

  @Column({ name: 'from_status_id', type: 'bigint', unsigned: true, nullable: true })
  fromStatusId!: string | null;

  @Column({ name: 'to_status_id', type: 'bigint', unsigned: true })
  toStatusId!: string;

  @Column({ name: 'changed_by', type: 'bigint', unsigned: true, nullable: true })
  changedBy!: string | null;

  @Column({ name: 'change_reason', type: 'text', nullable: true })
  changeReason!: string | null;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamp' })
  changedAt!: Date;

  @ManyToOne(() => IncidentEntity)
  @JoinColumn({ name: 'incident_id' })
  incident!: IncidentEntity;

  @ManyToOne(() => IncidentStatusEntity, { nullable: true })
  @JoinColumn({ name: 'from_status_id' })
  fromStatus!: IncidentStatusEntity | null;

  @ManyToOne(() => IncidentStatusEntity)
  @JoinColumn({ name: 'to_status_id' })
  toStatus!: IncidentStatusEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'changed_by' })
  changedByUser!: UserEntity | null;
}
