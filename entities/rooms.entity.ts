import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { RoomStatus } from "@/constants/booking.enum";
import { BookingEntity } from "./booking.entity";

@Entity('rooms')
export class RoomEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string

  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.AVAILABLE })
  status: RoomStatus

  @OneToMany(() => BookingEntity, booking => booking.room, { cascade: true })
  bookings: BookingEntity[]

}