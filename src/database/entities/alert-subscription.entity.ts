import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IncidentCategoryEntity } from './incident-category.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'alert_subscriptions' })
export class AlertSubscriptionEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string;

  @Column({ name: 'geographic_area', type: 'varchar', length: 255 })
  geographicArea!: string;

  @Column({ name: 'category_id', type: 'bigint', unsigned: true, nullable: true })
  categoryId!: string | null;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: () => '1' })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @ManyToOne(() => IncidentCategoryEntity, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category!: IncidentCategoryEntity | null;
}
