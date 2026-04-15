import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitorStatsEntity } from './visitor.entity';
import { VisitorService } from './visitor.service';
import { VisitorController } from './visitor.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VisitorStatsEntity])],
  providers: [VisitorService],
  controllers: [VisitorController],
})
export class VisitorModule {}
