import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { BookingEntity } from '@/entities/booking.entity';
import { SettingsService, SettingKey } from '../settings/settings.service';
import * as crypto from 'crypto';
// 

@Injectable()
export class LineNotificationService {
  private readonly logger = new Logger(LineNotificationService.name);
  private readonly pushUrl = 'https://api.line.me/v2/bot/message/push';
  private readonly replyUrl = 'https://api.line.me/v2/bot/message/reply';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService,
  ) { }

  verifySignature(body: string, signature: string): boolean {
    const channelSecret = this.configService.get<string>('LINE_CHANNEL_SECRET');
    if (!channelSecret) {
      this.logger.warn('LINE_CHANNEL_SECRET not configured');
      return false;
    }

    const hash = crypto
      .createHmac('SHA256', channelSecret)
      .update(body)
      .digest('base64');

    return hash === signature;
  }

  async sendBookingNotification(
    booking: BookingEntity,
    slipUrls: string[],
  ): Promise<void> {
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

    const fmt = (n?: number) => n?.toLocaleString() ?? '-';

    // Build Flex Message with buttons
    const flexMessage = this.buildBookingFlexMessage(booking, formatDate, fmt);

    const messages: any[] = [flexMessage];

    // Add slip images (max 4 since flex takes 1 slot)
    for (const url of slipUrls.slice(0, 4)) {
      messages.push({
        type: 'image',
        originalContentUrl: url,
        previewImageUrl: url,
      });
    }

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

  private buildBookingFlexMessage(
    booking: BookingEntity,
    formatDate: (date: Date) => string,
    fmt: (n?: number) => string,
  ): any {
    const bodyContents: any[] = [
      {
        type: 'text',
        text: '📋 การจองใหม่รอตรวจสอบ',
        weight: 'bold',
        size: 'lg',
        color: '#1a1a1a',
      },
      {
        type: 'separator',
        margin: 'md',
      },
      {
        type: 'box',
        layout: 'vertical',
        margin: 'md',
        spacing: 'sm',
        contents: [
          this.createFlexRow('🔖 Ref', booking.refCode),
          this.createFlexRow('👤 ชื่อ', booking.name),
          this.createFlexRow('📱 เบอร์โทร', booking.phoneNumber),
          this.createFlexRow('📅 เช็คอิน', formatDate(booking.checkinDate)),
          this.createFlexRow('📅 เช็คเอาท์', formatDate(booking.checkoutDate)),
          this.createFlexRow('👥 ผู้ใหญ่', `${booking.guestNumber} คน`),
        ],
      },
    ];

    // Add optional fields
    const optionalBox = bodyContents[2] as any;
    if (booking.childrenNumber) {
      optionalBox.contents.push(
        this.createFlexRow('👶 เด็ก', `${booking.childrenNumber} คน`),
      );
    }
    if (booking.additionGuestNumber) {
      optionalBox.contents.push(
        this.createFlexRow('🛏️ เตียงเสริม', `${booking.additionGuestNumber}`),
      );
    }

    // Payment info
    optionalBox.contents.push(
      this.createFlexRow('💰 ราคารวม', `${fmt(booking.totalPrice)} บาท`),
    );
    if (booking.discount) {
      optionalBox.contents.push(
        this.createFlexRow('🏷️ ส่วนลด', `-${fmt(booking.discount)} บาท`),
      );
    }
    optionalBox.contents.push(
      this.createFlexRow(
        '💳 ชำระ',
        booking.isOnlyDeposit
          ? `มัดจำ ${fmt(booking.paidAmount)} บาท`
          : `เต็มจำนวน ${fmt(booking.paidAmount)} บาท`,
      ),
    );
    if (booking.remainingAmount) {
      optionalBox.contents.push(
        this.createFlexRow('📌 ค้างจ่าย', `${fmt(booking.remainingAmount)} บาท`),
      );
    }

    if (booking.remark) {
      optionalBox.contents.push(
        this.createFlexRow('📝 หมายเหตุ', booking.remark),
      );
    }

    return {
      type: 'flex',
      altText: `การจองใหม่: ${booking.refCode}`,
      contents: {
        type: 'bubble',
        size: 'mega',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: bodyContents,
        },
        footer: {
          type: 'box',
          layout: 'horizontal',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'primary',
              color: '#22c55e',
              action: {
                type: 'uri',
                label: '✓ ยืนยัน',
                uri: `https://liff.line.me/${this.configService.get('LINE_LIFF_ID')}?bookingId=${booking.id}&action=confirm&liffId=${this.configService.get('LINE_LIFF_ID')}`,
              },
            },
            {
              type: 'button',
              style: 'primary',
              color: '#ef4444',
              action: {
                type: 'uri',
                label: '✗ ปฏิเสธ',
                uri: `https://liff.line.me/${this.configService.get('LINE_LIFF_ID')}?bookingId=${booking.id}&action=reject&liffId=${this.configService.get('LINE_LIFF_ID')}`,
              },
            },
          ],
        },
      },
    };
  }

  private createFlexRow(label: string, value: string): any {
    return {
      type: 'box',
      layout: 'horizontal',
      contents: [
        {
          type: 'text',
          text: label,
          size: 'sm',
          color: '#555555',
          flex: 0,
        },
        {
          type: 'text',
          text: value,
          size: 'sm',
          color: '#111111',
          align: 'end',
          wrap: true,
        },
      ],
    };
  }

  async replyMessage(replyToken: string, text: string): Promise<void> {
    const token = this.configService.get<string>('LINE_CHANNEL_ACCESS_TOKEN');
    if (!token) return;

    try {
      await firstValueFrom(
        this.httpService.post(
          this.replyUrl,
          {
            replyToken,
            messages: [{ type: 'text', text }],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
    } catch (error) {
      this.logger.error('Failed to reply message', error?.response?.data ?? error.message);
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
