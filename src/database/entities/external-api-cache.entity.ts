import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'external_api_caches' })
export class ExternalApiCacheEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  provider!: string;

  @Column({ type: 'varchar', length: 100 })
  endpoint!: string;

  @Column({ name: 'cache_key', type: 'varchar', length: 191 })
  cacheKey!: string;

  @Column({ name: 'request_url', type: 'varchar', length: 500 })
  requestUrl!: string;

  @Column({ name: 'response_payload', type: 'json' })
  responsePayload!: Record<string, unknown>;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
