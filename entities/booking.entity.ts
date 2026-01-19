import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Optional } from '@nestjs/common';
import { BookingStatus } from 'constants/booking.enum';
import { RoomEntity } from './rooms.entity';

@Entity('booking')
@Index(['refCode'])
@Index(['checkinDate', 'checkoutDate'])
@Index(['status'])
export class BookingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  refCode: string;

  @Column()
  checkinDate: Date;

  @Column()
  checkoutDate: Date;

  @Column()
  guestNumber: number;

  @Column({ nullable: true })
  @Optional()
  additionGuestNumber: number;

  @Column()
  name: string;

  @Column()
  phoneNumber: string;

  @Column({ nullable: true })
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PAYMENT,
  })
  status: BookingStatus;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column()
  roomId: string;

  @ManyToOne(() => RoomEntity, room => room.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room: RoomEntity;
}