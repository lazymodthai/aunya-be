import { Module } from '@nestjs/common';
import { PricesService } from './prices.service';
import { PricesController } from './prices.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceCalendarEntity } from './entities/price-calendar.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PriceCalendarEntity])],
  controllers: [PricesController],
  providers: [PricesService],
  exports: [PricesService],
})
export class PricesModule {}
