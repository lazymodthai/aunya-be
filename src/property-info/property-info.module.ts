import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyInfoEntity } from './property-info.entity';
import { PropertyInfoService } from './property-info.service';
import { PropertyInfoController } from './property-info.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PropertyInfoEntity])],
  controllers: [PropertyInfoController],
  providers: [PropertyInfoService],
  exports: [PropertyInfoService],
})
export class PropertyInfoModule {}
