import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { PricesService } from './prices.service';
import { PricesController } from './prices.controller';
import { PriceCalendarEntity } from './entities/price-calendar.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PriceCalendarEntity]),
    HttpModule,
    ConfigModule,
  ],
  controllers: [PricesController],
  providers: [PricesService],
})
export class PricesModule {}