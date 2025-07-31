import { UserEntity } from 'src/users/users.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('booking')
export class BookingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  refCode: string;

  // @ManyToOne(() => User)
  // @JoinColumn({ name: 'userId' })
  // user: User;

  // @Column()
  // userId: number;

  @Column()
  checkinDate: Date;

  @Column()
  checkoutDate: Date;

  @Column()
  guestNumber: number;

  @Column({ nullable: true })
  additionGuestNumber: number;

  @Column()
  name: string;

  @Column()
  phoneNumber: string;

  @Column()
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
}