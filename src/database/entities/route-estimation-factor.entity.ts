import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CheckpointEntity } from './checkpoint.entity';
import { IncidentEntity } from './incident.entity';
import { RouteEstimationEntity } from './route-estimation.entity';

@Entity({ name: 'route_estimation_factors' })
export class RouteEstimationFactorEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'route_estimation_id', type: 'bigint', unsigned: true })
  routeEstimationId!: string;

  @Column({ name: 'factor_type', type: 'varchar', length: 50 })
  factorType!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'delay_minutes', type: 'int', unsigned: true, default: () => '0' })
  delayMinutes!: number;

  @Column({ name: 'affected_checkpoint_id', type: 'bigint', unsigned: true, nullable: true })
  affectedCheckpointId!: string | null;

  @Column({ name: 'affected_incident_id', type: 'bigint', unsigned: true, nullable: true })
  affectedIncidentId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => RouteEstimationEntity, (routeEstimation) => routeEstimation.factors, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'route_estimation_id' })
  routeEstimation!: RouteEstimationEntity;

  @ManyToOne(() => CheckpointEntity, { nullable: true })
  @JoinColumn({ name: 'affected_checkpoint_id' })
  affectedCheckpoint!: CheckpointEntity | null;

  @ManyToOne(() => IncidentEntity, { nullable: true })
  @JoinColumn({ name: 'affected_incident_id' })
  affectedIncident!: IncidentEntity | null;
}
