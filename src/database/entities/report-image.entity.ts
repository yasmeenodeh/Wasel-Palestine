import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReportImageAnalysisEntity } from './report-image-analysis.entity';
import { ReportEntity } from './report.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'report_images' })
export class ReportImageEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'report_id', type: 'bigint', unsigned: true })
  reportId!: string;

  @Column({ name: 'uploaded_by', type: 'bigint', unsigned: true, nullable: true })
  uploadedBy!: string | null;

  @Column({ name: 'image_url', type: 'varchar', length: 500 })
  imageUrl!: string;

  @Column({
    name: 'media_type',
    type: 'enum',
    enum: ['accident', 'checkpoint', 'traffic'],
  })
  mediaType!: 'accident' | 'checkpoint' | 'traffic';

  @Column({ type: 'varchar', length: 255, nullable: true })
  caption!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => ReportEntity)
  @JoinColumn({ name: 'report_id' })
  report!: ReportEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedByUser!: UserEntity | null;

  @OneToMany(() => ReportImageAnalysisEntity, (analysis) => analysis.reportImage)
  analyses!: ReportImageAnalysisEntity[];
}
