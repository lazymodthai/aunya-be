import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('property_info')
export class PropertyInfoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  category: string; // 'general' | 'facilities' | 'policies'

  @Column({ type: 'varchar', length: 500 })
  label: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  labelEn: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  iconUrl: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  iconS3Key: string;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
