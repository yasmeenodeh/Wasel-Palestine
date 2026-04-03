import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CheckpointEntity } from './checkpoint.entity';
import { IncidentCategoryEntity } from './incident-category.entity';
import { IncidentSeverityEntity } from './incident-severity.entity';
import { IncidentStatusEntity } from './incident-status.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'incidents' })
export class IncidentEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude!: string;

  @Column({ name: 'category_id', type: 'bigint', unsigned: true })
  categoryId!: string;

  @Column({ name: 'severity_id', type: 'bigint', unsigned: true })
  severityId!: string;

  @Column({ name: 'status_id', type: 'bigint', unsigned: true })
  statusId!: string;

  @Column({ name: 'checkpoint_id', type: 'bigint', unsigned: true, nullable: true })
  checkpointId!: string | null;

  @Column({ name: 'created_by', type: 'bigint', unsigned: true })
  createdBy!: string;

  @Column({ name: 'verified_by', type: 'bigint', unsigned: true, nullable: true })
  verifiedBy!: string | null;

  @Column({ name: 'closed_by', type: 'bigint', unsigned: true, nullable: true })
  closedBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt!: Date | null;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt!: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => IncidentCategoryEntity)
  @JoinColumn({ name: 'category_id' })
  category!: IncidentCategoryEntity;

  @ManyToOne(() => IncidentSeverityEntity)
  @JoinColumn({ name: 'severity_id' })
  severity!: IncidentSeverityEntity;

  @ManyToOne(() => IncidentStatusEntity)
  @JoinColumn({ name: 'status_id' })
  status!: IncidentStatusEntity;

  @ManyToOne(() => CheckpointEntity, { nullable: true })
  @JoinColumn({ name: 'checkpoint_id' })
  checkpoint!: CheckpointEntity | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  createdByUser!: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifiedByUser!: UserEntity | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'closed_by' })
  closedByUser!: UserEntity | null;
}
