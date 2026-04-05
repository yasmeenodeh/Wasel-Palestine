import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AlertSubscriptionEntity } from './alert-subscription.entity';
import { IncidentEntity } from './incident.entity';

@Entity({ name: 'alerts' })
export class AlertEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'subscription_id', type: 'bigint', unsigned: true })
  subscriptionId!: string;

  @Column({ name: 'incident_id', type: 'bigint', unsigned: true })
  incidentId!: string;

  @Column({ name: 'alert_type', type: 'varchar', length: 50 })
  alertType!: string;

  @Column({ type: 'enum', enum: ['pending', 'sent', 'failed', 'read'], default: 'pending' })
  status!: 'pending' | 'sent' | 'failed' | 'read';

  @Column({ type: 'json' })
  payload!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt!: Date | null;

  @ManyToOne(() => AlertSubscriptionEntity)
  @JoinColumn({ name: 'subscription_id' })
  subscription!: AlertSubscriptionEntity;

  @ManyToOne(() => IncidentEntity)
  @JoinColumn({ name: 'incident_id' })
  incident!: IncidentEntity;
}
