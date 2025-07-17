import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('booking-optional')
export class BookingOptional {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  optionName: string;

  @Column()
  optionPrice: number

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;  
}