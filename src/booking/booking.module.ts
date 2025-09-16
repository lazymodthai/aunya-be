import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingEntity } from './entities/booking.entity';
import { RoomEntity } from './entities/rooms.entity';
import { PriceCalendarEntity } from 'src/prices/entities/price-calendar.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BookingEntity, RoomEntity, PriceCalendarEntity])],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
