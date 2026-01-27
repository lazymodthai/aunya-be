import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiProperty } from '@nestjs/swagger';
import { LineNotificationService } from './line-notification.service';
import { IsOptional, IsString } from 'class-validator';
import { AdminOnly } from '@src/auth/decorators';

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
  constructor(
    private readonly lineNotificationService: LineNotificationService,
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
}
