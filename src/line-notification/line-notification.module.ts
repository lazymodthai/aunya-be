import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { LineNotificationService } from './line-notification.service';
import { LineNotificationController } from './line-notification.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [HttpModule, ConfigModule, SettingsModule],
  controllers: [LineNotificationController],
  providers: [LineNotificationService],
  exports: [LineNotificationService],
})
export class LineNotificationModule {}
