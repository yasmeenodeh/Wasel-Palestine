import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReportImageEntity } from './report-image.entity';

@Entity({ name: 'report_image_analyses' })
export class ReportImageAnalysisEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'report_image_id', type: 'bigint', unsigned: true })
  reportImageId!: string;

  @Column({ name: 'analysis_provider', type: 'varchar', length: 100 })
  analysisProvider!: string;

  @Column({ name: 'detected_label', type: 'varchar', length: 100 })
  detectedLabel!: string;

  @Column({ name: 'confidence_score', type: 'decimal', precision: 5, scale: 2 })
  confidenceScore!: string;

  @Column({ type: 'text' })
  summary!: string;

  @Column({ name: 'severity_hint', type: 'varchar', length: 50, nullable: true })
  severityHint!: string | null;

  @Column({ name: 'is_relevant', type: 'tinyint', width: 1, default: () => '1' })
  isRelevant!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => ReportImageEntity)
  @JoinColumn({ name: 'report_image_id' })
  reportImage!: ReportImageEntity;
}
