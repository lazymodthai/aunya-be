import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('visitor_stats')
export class VisitorStatsEntity {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  @Column({ type: 'bigint', default: 0 })
  count: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
