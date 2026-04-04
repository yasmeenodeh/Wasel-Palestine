import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IncidentCategoryEntity } from './incident-category.entity';
import { IncidentEntity } from './incident.entity';
import { ReportModerationActionEntity } from './report-moderation-action.entity';
import { ReportVoteEntity } from './report-vote.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'reports' })
export class ReportEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'submitted_by', type: 'bigint', unsigned: true, nullable: true })
  submittedBy!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude!: string;

  @Column({ name: 'category_id', type: 'bigint', unsigned: true })
  categoryId!: string;

  @Column({ type: 'text' })
  description!: string;

  @CreateDateColumn({ name: 'reported_at', type: 'timestamp' })
  reportedAt!: Date;

  @Column({
    type: 'enum',
    enum: ['pending', 'under_review', 'approved', 'rejected', 'merged', 'converted'],
    default: 'pending',
  })
  status!: 'pending' | 'under_review' | 'approved' | 'rejected' | 'merged' | 'converted';

  @Column({ name: 'confidence_score', type: 'decimal', precision: 5, scale: 2, default: () => '0.00' })
  confidenceScore!: string;

  @Column({ name: 'duplicate_of_report_id', type: 'bigint', unsigned: true, nullable: true })
  duplicateOfReportId!: string | null;

  @Column({ name: 'converted_incident_id', type: 'bigint', unsigned: true, nullable: true })
  convertedIncidentId!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'submitted_by' })
  submittedByUser!: UserEntity | null;

  @ManyToOne(() => IncidentCategoryEntity)
  @JoinColumn({ name: 'category_id' })
  category!: IncidentCategoryEntity;

  @ManyToOne(() => ReportEntity, { nullable: true })
  @JoinColumn({ name: 'duplicate_of_report_id' })
  duplicateOfReport!: ReportEntity | null;

  @ManyToOne(() => IncidentEntity, { nullable: true })
  @JoinColumn({ name: 'converted_incident_id' })
  convertedIncident!: IncidentEntity | null;

  @OneToMany(() => ReportVoteEntity, (vote) => vote.report)
  votes!: ReportVoteEntity[];

  @OneToMany(() => ReportModerationActionEntity, (action) => action.report)
  moderationActions!: ReportModerationActionEntity[];
}
