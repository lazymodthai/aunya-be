import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingEntity } from '@/entities/booking.entity';
import { RoomEntity } from '@/entities/rooms.entity';
import { PriceCalendarEntity } from 'entities/price-calendar.entity';
import { FilesModule } from '../files/files.module';
import { LineNotificationModule } from '../line-notification/line-notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BookingEntity, RoomEntity, PriceCalendarEntity]),
    FilesModule,
    LineNotificationModule,
  ],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule { }
