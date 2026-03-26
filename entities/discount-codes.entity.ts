import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('discount_codes')
@Index(['code'])
export class DiscountCodeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 10 })
  code: string;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true }) // 9999.99
  discount?: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true }) // 999.99
  discountPercentage?: number | null;

  @Column({ default: 1 })
  count: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  usedAt: Date | null;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  updatedAt: Date;
}