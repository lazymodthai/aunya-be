import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { DayType } from "../../booking/enums/booking.enum";
import { RoomEntity } from "../../booking/entities/rooms.entity";

@Entity('price_calendar')
export class PriceCalendarEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'enum', enum: DayType, default: DayType.WEEKDAY })
  dayType: DayType;

  @ManyToOne(() => RoomEntity)
  @JoinColumn({ name: 'roomId' })
  room: RoomEntity;

  @Column()
  roomId: string;
}