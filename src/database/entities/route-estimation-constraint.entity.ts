import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RouteEstimationEntity } from './route-estimation.entity';

@Entity({ name: 'route_estimation_constraints' })
export class RouteEstimationConstraintEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ name: 'route_estimation_id', type: 'bigint', unsigned: true })
  routeEstimationId!: string;

  @Column({ name: 'constraint_type', type: 'varchar', length: 50 })
  constraintType!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  value!: string | null;

  @ManyToOne(() => RouteEstimationEntity, (routeEstimation) => routeEstimation.constraints, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'route_estimation_id' })
  routeEstimation!: RouteEstimationEntity;
}
