import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { LineNotificationService } from './line-notification.service';
import { LineNotificationController } from './line-notification.controller';
import { SettingsModule } from '../settings/settings.module';
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    SettingsModule,
    forwardRef(() => BookingModule),
  ],
  controllers: [LineNotificationController],
  providers: [LineNotificationService],
  exports: [LineNotificationService],
})
export class LineNotificationModule {}
