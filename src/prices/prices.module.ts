import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { PricesService } from './prices.service';
import { PricesController } from './prices.controller';
import { PriceCalendarEntity } from '@/entities/price-calendar.entity';
import { DiscountCodeEntity } from '@/entities/discount-codes.entity';
import { BookingEntity } from '@/entities/booking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PriceCalendarEntity, DiscountCodeEntity, BookingEntity]),
    HttpModule,
    ConfigModule,
  ],
  controllers: [PricesController],
  providers: [PricesService],
  exports: [PricesService],
})
export class PricesModule { }