import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
  HttpCode,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PropertyInfoService } from './property-info.service';
import { nipaS3 } from '../files/nipa';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { AdminOnly } from '@src/auth/decorators';

const ALLOWED_MIME = ['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg'];

@ApiTags('PropertyInfo')
@Controller('property-info')
export class PropertyInfoController {
  constructor(private readonly service: PropertyInfoService) {}

  @Get()
  @Header('Cache-Control', 'no-cache')
  @ApiOperation({ summary: 'ดึงรายการข้อมูลบ้านพัก' })
  @ApiQuery({ name: 'category', required: false, description: 'general | facilities | policies' })
  @ApiOkResponse({ description: 'รายการ property info' })
  @HttpCode(HttpStatus.OK)
  async findAll(@Query('category') category?: string) {
    const items = await this.service.findAll(category);
    return items.map((item) => ({
      id: item.id,
      category: item.category,
      label: item.label,
      labelEn: item.labelEn ?? null,
      iconUrl: item.iconUrl ?? null,
      sortOrder: item.sortOrder,
    }));
  }

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'เพิ่มรายการใหม่ (Admin)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        category: { type: 'string', example: 'facilities' },
        label: { type: 'string', example: 'สระว่ายน้ำ' },
        labelEn: { type: 'string', example: 'Swimming Pool' },
        sortOrder: { type: 'number', example: 0 },
      },
      required: ['category', 'label'],
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: { category: string; label: string; labelEn?: string; sortOrder?: number },
  ) {
    const item = await this.service.create(body);
    return {
      message: 'เพิ่มรายการสำเร็จ',
      data: { id: item.id, category: item.category, label: item.label, labelEn: item.labelEn ?? null, iconUrl: item.iconUrl ?? null, sortOrder: item.sortOrder },
    };
  }

  @Patch(':id/label')
  @AdminOnly()
  @ApiOperation({ summary: 'อัปเดตข้อความ (Admin)' })
  @ApiParam({ name: 'id', description: 'PropertyInfo ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { label: { type: 'string' } },
      required: ['label'],
    },
  })
  @HttpCode(HttpStatus.OK)
  async updateLabel(@Param('id') id: string, @Body() body: { label: string }) {
    const item = await this.service.updateLabel(id, body.label);
    return { message: 'อัปเดตสำเร็จ', data: { id: item.id, label: item.label } };
  }

  @Post(':id/icon')
  @AdminOnly()
  @ApiOperation({ summary: 'อัปโหลด/เปลี่ยน icon (Admin, รองรับ png/svg/webp)' })
  @ApiParam({ name: 'id', description: 'PropertyInfo ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadIcon(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new HttpException('ไม่พบไฟล์', HttpStatus.BAD_REQUEST);
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new HttpException('รองรับเฉพาะ png, svg, webp', HttpStatus.BAD_REQUEST);
    }

    const ext = file.originalname.split('.').pop();
    const s3Key = `property-info/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    try {
      await nipaS3.send(
        new PutObjectCommand({
          Bucket: process.env.NIPA_CLOUD_BUCKET_NAME,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    } catch (error) {
      console.error('S3 Upload Error in PropertyInfo:', error);
      throw new HttpException('อัปโหลดไฟล์ล้มเหลว', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const iconUrl = `${process.env.NIPA_CLOUD_ENDPOINT}/${process.env.NIPA_CLOUD_BUCKET_NAME}/${s3Key}`;
    const updated = await this.service.updateIcon(id, iconUrl, s3Key);

    // Delete old icon from S3 if exists
    if (updated.iconS3Key) {
      try {
        await nipaS3.send(
          new DeleteObjectCommand({
            Bucket: process.env.NIPA_CLOUD_BUCKET_NAME,
            Key: updated.iconS3Key,
          }),
        );
      } catch { /* ignore S3 deletion errors */ }
    }

    return { message: 'อัปโหลด icon สำเร็จ', data: { id, iconUrl } };
  }

  @Delete(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'ลบรายการ (Admin)' })
  @ApiParam({ name: 'id', description: 'PropertyInfo ID' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    const item = await this.service.remove(id);

    if (item.iconS3Key) {
      try {
        await nipaS3.send(
          new DeleteObjectCommand({
            Bucket: process.env.NIPA_CLOUD_BUCKET_NAME,
            Key: item.iconS3Key,
          }),
        );
      } catch { /* ignore */ }
    }

    return { message: 'ลบรายการสำเร็จ' };
  }
}
