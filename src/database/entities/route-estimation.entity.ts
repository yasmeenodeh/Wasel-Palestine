import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RouteEstimationConstraintEntity } from './route-estimation-constraint.entity';
import { RouteEstimationFactorEntity } from './route-estimation-factor.entity';

@Entity({ name: 'route_estimations' })
export class RouteEstimationEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'start_lat', type: 'decimal', precision: 10, scale: 7 })
  startLat!: string;

  @Column({ name: 'start_lng', type: 'decimal', precision: 10, scale: 7 })
  startLng!: string;

  @Column({ name: 'end_lat', type: 'decimal', precision: 10, scale: 7 })
  endLat!: string;

  @Column({ name: 'end_lng', type: 'decimal', precision: 10, scale: 7 })
  endLng!: string;

  @Column({ name: 'estimated_distance_km', type: 'decimal', precision: 10, scale: 2 })
  estimatedDistanceKm!: string;

  @Column({ name: 'estimated_duration_minutes', type: 'int', unsigned: true })
  estimatedDurationMinutes!: number;

  @Column({ name: 'base_duration_minutes', type: 'int', unsigned: true })
  baseDurationMinutes!: number;

  @Column({ name: 'constraints_delay_minutes', type: 'int', unsigned: true, default: () => '0' })
  constraintsDelayMinutes!: number;

  @Column({ name: 'mobility_delay_minutes', type: 'int', unsigned: true, default: () => '0' })
  mobilityDelayMinutes!: number;

  @Column({ name: 'route_provider', type: 'varchar', length: 50, nullable: true })
  routeProvider!: string | null;

  @Column({ name: 'route_provider_source', type: 'varchar', length: 30, nullable: true })
  routeProviderSource!: string | null;

  @Column({ name: 'weather_provider', type: 'varchar', length: 50, nullable: true })
  weatherProvider!: string | null;

  @Column({ name: 'weather_provider_source', type: 'varchar', length: 30, nullable: true })
  weatherProviderSource!: string | null;

  @Column({ type: 'json', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @OneToMany(() => RouteEstimationConstraintEntity, (constraint) => constraint.routeEstimation)
  constraints!: RouteEstimationConstraintEntity[];

  @OneToMany(() => RouteEstimationFactorEntity, (factor) => factor.routeEstimation)
  factors!: RouteEstimationFactorEntity[];
}
