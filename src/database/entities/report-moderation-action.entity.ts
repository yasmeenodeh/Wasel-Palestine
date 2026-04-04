import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IncidentEntity } from './incident.entity';
import { ReportEntity } from './report.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'report_moderation_actions' })
export class ReportModerationActionEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'report_id', type: 'bigint', unsigned: true })
  reportId!: string;

  @Column({
    name: 'action_type',
    type: 'enum',
    enum: ['approved', 'rejected', 'merged', 'flagged_abuse', 'converted_to_incident'],
  })
  actionType!: 'approved' | 'rejected' | 'merged' | 'flagged_abuse' | 'converted_to_incident';

  @Column({ name: 'performed_by', type: 'bigint', unsigned: true, nullable: true })
  performedBy!: string | null;

  @Column({ name: 'target_report_id', type: 'bigint', unsigned: true, nullable: true })
  targetReportId!: string | null;

  @Column({ name: 'target_incident_id', type: 'bigint', unsigned: true, nullable: true })
  targetIncidentId!: string | null;

  @Column({ name: 'action_note', type: 'text', nullable: true })
  actionNote!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => ReportEntity, (report) => report.moderationActions)
  @JoinColumn({ name: 'report_id' })
  report!: ReportEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'performed_by' })
  performedByUser!: UserEntity | null;

  @ManyToOne(() => ReportEntity, { nullable: true })
  @JoinColumn({ name: 'target_report_id' })
  targetReport!: ReportEntity | null;

  @ManyToOne(() => IncidentEntity, { nullable: true })
  @JoinColumn({ name: 'target_incident_id' })
  targetIncident!: IncidentEntity | null;
}
