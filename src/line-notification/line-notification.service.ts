import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { BookingEntity } from '@/entities/booking.entity';
import { SettingsService, SettingKey } from '../settings/settings.service';

@Injectable()
export class LineNotificationService {
  private readonly logger = new Logger(LineNotificationService.name);
  private readonly pushUrl = 'https://api.line.me/v2/bot/message/push';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService,
  ) {}

  async sendBookingNotification(
    booking: BookingEntity,
    slipUrls: string[],
  ): Promise<void> {
    // Check if LINE notification is enabled
    try {
      const isEnabled = await this.settingsService.getSettingAsBoolean(
        SettingKey.LINE_NOTIFICATION,
      );
      if (!isEnabled) {
        this.logger.log('LINE notification is disabled in settings');
        return;
      }
    } catch {
      this.logger.warn('Could not read LINE_NOTIFICATION setting, skipping');
      return;
    }

    const token = this.configService.get<string>('LINE_CHANNEL_ACCESS_TOKEN');
    const groupId = this.configService.get<string>('LINE_GROUP_ID');

    if (!token || !groupId) {
      this.logger.warn(
        'LINE_CHANNEL_ACCESS_TOKEN or LINE_GROUP_ID not configured',
      );
      return;
    }

    const formatDate = (date: Date): string => {
      const d = new Date(date);
      return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const textMessage = [
      `📋 การจองใหม่รอตรวจสอบ`,
      ``,
      `🔖 Ref: ${booking.refCode}`,
      `👤 ชื่อ: ${booking.name}`,
      `📱 เบอร์โทร: ${booking.phoneNumber}`,
      `📅 เช็คอิน: ${formatDate(booking.checkinDate)}`,
      `📅 เช็คเอาท์: ${formatDate(booking.checkoutDate)}`,
      `👥 ผู้เข้าพัก: ${booking.guestNumber} คน`,
      booking.additionGuestNumber
        ? `🛏️ เตียงเสริม: ${booking.additionGuestNumber}`
        : null,
      `💰 ราคารวม: ${booking.totalPrice?.toLocaleString() ?? '-'} บาท`,
    ]
      .filter(Boolean)
      .join('\n');

    const messages: any[] = [{ type: 'text', text: textMessage }];

    for (const url of slipUrls) {
      messages.push({
        type: 'image',
        originalContentUrl: url,
        previewImageUrl: url,
      });
    }

    // LINE API allows max 5 messages per push
    const messagesToSend = messages.slice(0, 5);

    try {
      await firstValueFrom(
        this.httpService.post(
          this.pushUrl,
          { to: groupId, messages: messagesToSend },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      this.logger.log(
        `LINE notification sent for booking ${booking.refCode}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send LINE notification for booking ${booking.refCode}`,
        error?.response?.data ?? error.message,
      );
    }
  }

  async sendTestMessage(
    message: string,
    imageUrl?: string,
  ): Promise<{ success: boolean; message: string; error?: any }> {
    const token = this.configService.get<string>('LINE_CHANNEL_ACCESS_TOKEN');
    const groupId = this.configService.get<string>('LINE_GROUP_ID');

    if (!token || !groupId) {
      return {
        success: false,
        message: 'LINE_CHANNEL_ACCESS_TOKEN or LINE_GROUP_ID not configured',
      };
    }

    const messages: any[] = [{ type: 'text', text: message }];

    if (imageUrl) {
      messages.push({
        type: 'image',
        originalContentUrl: imageUrl,
        previewImageUrl: imageUrl,
      });
    }

    try {
      await firstValueFrom(
        this.httpService.post(
          this.pushUrl,
          { to: groupId, messages },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      this.logger.log('Test LINE message sent successfully');
      return { success: true, message: 'ส่งข้อความสำเร็จ' };
    } catch (error) {
      const errorData = error?.response?.data ?? error.message;
      this.logger.error('Failed to send test LINE message', errorData);
      return {
        success: false,
        message: 'ส่งข้อความไม่สำเร็จ',
        error: errorData,
      };
    }
  }
}
