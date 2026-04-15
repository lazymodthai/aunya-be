import { Controller, Get, Post, HttpCode, HttpStatus, Header } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VisitorService } from './visitor.service';

@ApiTags('Visitor')
@Controller('visitor')
export class VisitorController {
  constructor(private readonly service: VisitorService) {}

  @Post('ping')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'นับผู้เข้าชมเว็บ (เรียกครั้งแรกต่อ session)' })
  async ping() {
    const count = await this.service.increment();
    return { count };
  }

  @Get('count')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-cache')
  @ApiOperation({ summary: 'ดูยอดผู้เข้าชมทั้งหมด' })
  async count() {
    const count = await this.service.getCount();
    return { count };
  }
}
