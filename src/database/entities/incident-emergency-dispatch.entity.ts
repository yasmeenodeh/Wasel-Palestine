import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EmergencyServiceCenterEntity } from './emergency-service-center.entity';
import { IncidentEntity } from './incident.entity';

@Entity({ name: 'incident_emergency_dispatches' })
export class IncidentEmergencyDispatchEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'incident_id', type: 'bigint', unsigned: true })
  incidentId!: string;

  @Column({ name: 'emergency_service_center_id', type: 'bigint', unsigned: true })
  emergencyServiceCenterId!: string;

  @Column({
    name: 'service_type',
    type: 'enum',
    enum: ['police', 'ambulance', 'hospital'],
  })
  serviceType!: 'police' | 'ambulance' | 'hospital';

  @Column({
    type: 'enum',
    enum: ['pending', 'dispatched', 'acknowledged'],
    default: 'dispatched',
  })
  status!: 'pending' | 'dispatched' | 'acknowledged';

  @Column({ name: 'distance_km', type: 'decimal', precision: 8, scale: 2 })
  distanceKm!: string;

  @Column({ type: 'json', nullable: true })
  payload!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @Column({ name: 'dispatched_at', type: 'timestamp', nullable: true })
  dispatchedAt!: Date | null;

  @Column({ name: 'acknowledged_at', type: 'timestamp', nullable: true })
  acknowledgedAt!: Date | null;

  @ManyToOne(() => IncidentEntity)
  @JoinColumn({ name: 'incident_id' })
  incident!: IncidentEntity;

  @ManyToOne(() => EmergencyServiceCenterEntity)
  @JoinColumn({ name: 'emergency_service_center_id' })
  emergencyServiceCenter!: EmergencyServiceCenterEntity;
}
