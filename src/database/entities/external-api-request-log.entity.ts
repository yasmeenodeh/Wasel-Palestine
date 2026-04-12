import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'external_api_request_logs' })
export class ExternalApiRequestLogEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  provider!: string;

  @Column({ type: 'varchar', length: 100 })
  endpoint!: string;

  @Column({ name: 'cache_key', type: 'varchar', length: 191, nullable: true })
  cacheKey!: string | null;

  @Column({ name: 'request_url', type: 'varchar', length: 500 })
  requestUrl!: string;

  @Column({ name: 'status_code', type: 'int', unsigned: true, nullable: true })
  statusCode!: number | null;

  @Column({ name: 'duration_ms', type: 'int', unsigned: true, nullable: true })
  durationMs!: number | null;

  @Column({ name: 'was_cached', type: 'tinyint', width: 1, default: () => '0' })
  wasCached!: boolean;

  @Column({ name: 'was_successful', type: 'tinyint', width: 1, default: () => '1' })
  wasSuccessful!: boolean;

  @Column({ name: 'error_message', type: 'varchar', length: 255, nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
