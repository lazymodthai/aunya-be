import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  Req,
  Logger,
  RawBodyRequest,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiProperty, ApiExcludeEndpoint } from '@nestjs/swagger';
import { LineNotificationService } from './line-notification.service';
import { IsOptional, IsString } from 'class-validator';
import { AdminOnly } from '@src/auth/decorators';
import { BookingService } from '../booking/booking.service';
import { BookingStatus } from '@/constants/booking.enum';
import { Request } from 'express';

class TestLineMessageDto {
  @ApiProperty({
    description: 'ข้อความที่ต้องการส่ง',
    example: 'ทดสอบส่งข้อความจากระบบ',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'URL รูปภาพ (ถ้ามี)',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

@ApiTags('LINE Notification')
@Controller('line-notification')
export class LineNotificationController {
  private readonly logger = new Logger(LineNotificationController.name);

  constructor(
    private readonly lineNotificationService: LineNotificationService,
    @Inject(forwardRef(() => BookingService))
    private readonly bookingService: BookingService,
  ) {}

  @Post('test')
  @AdminOnly()
  @ApiOperation({
    summary: 'ทดสอบส่ง LINE message',
    description: 'ส่งข้อความทดสอบไปยังกลุ่ม LINE ที่ตั้งค่าไว้',
  })
  @ApiBody({ type: TestLineMessageDto })
  @HttpCode(HttpStatus.OK)
  async testSendMessage(@Body() dto: TestLineMessageDto) {
    const result = await this.lineNotificationService.sendTestMessage(
      dto.message,
      dto.imageUrl,
    );
    return result;
  }

  @Post('webhook')
  @ApiExcludeEndpoint()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-line-signature') signature: string,
    @Body() body: any,
  ) {
    // Verify signature
    const rawBody = req.rawBody?.toString() ?? JSON.stringify(body);
    if (!this.lineNotificationService.verifySignature(rawBody, signature)) {
      this.logger.warn('Invalid LINE webhook signature');
      return { status: 'invalid signature' };
    }

    // Process events
    const events = body.events ?? [];
    for (const event of events) {
      if (event.type === 'postback') {
        await this.handlePostback(event);
      }
    }

    return { status: 'ok' };
  }

  private async handlePostback(event: any): Promise<void> {
    const data = event.postback?.data;
    if (!data) return;

    // Parse postback data: action=confirm&bookingId=xxx
    const params = new URLSearchParams(data);
    const action = params.get('action');
    const bookingId = params.get('bookingId');

    if (!action || !bookingId) return;

    try {
      let replyText = '';

      if (action === 'confirm') {
        await this.bookingService.updateBookingStatus(
          bookingId,
          BookingStatus.CONFIRMED,
        );
        replyText = `✅ ยืนยันการจองเรียบร้อยแล้ว`;
      } else if (action === 'reject') {
        await this.bookingService.updateBookingStatus(
          bookingId,
          BookingStatus.CANCELLED,
        );
        replyText = `❌ ปฏิเสธการจองเรียบร้อยแล้ว`;
      }

      if (replyText && event.replyToken) {
        await this.lineNotificationService.replyMessage(
          event.replyToken,
          replyText,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to handle postback: ${error.message}`);
      if (event.replyToken) {
        await this.lineNotificationService.replyMessage(
          event.replyToken,
          `⚠️ เกิดข้อผิดพลาด: ${error.message}`,
        );
      }
    }
  }
}
