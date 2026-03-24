import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiOkResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { GalleryService } from './gallery.service';
import { nipaS3 } from '../files/nipa';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { AdminOnly } from '@src/auth/decorators';

@ApiTags('Gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Post('upload')
  @AdminOnly()
  @ApiOperation({
    summary: 'อัปโหลดรูปสำหรับ SwiperSlide',
    description: 'อัปโหลดรูปภาพเพื่อแสดงใน Gallery / SwiperSlide',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'ไฟล์รูปภาพ',
        },
        alt: {
          type: 'string',
          description: 'คำอธิบายรูปภาพ (alt text)',
        },
        sortOrder: {
          type: 'number',
          description: 'ลำดับการแสดงผล (0 = แสดงก่อน)',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { alt?: string; sortOrder?: string },
  ) {
    if (!file) {
      throw new HttpException('ไม่พบไฟล์ที่อัปโหลด', HttpStatus.BAD_REQUEST);
    }

    const fileExt = file.originalname.split('.').pop();
    const s3Key = `gallery/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    try {
      await nipaS3.send(
        new PutObjectCommand({
          Bucket: process.env.NIPA_CLOUD_BUCKET_NAME,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        }),
      );
    } catch (error) {
      console.error("S3 Upload Error in Gallery:", error);
      throw new HttpException(
        "อัปโหลดไฟล์ไปยัง S3 ล้มเหลว",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const fileUrl = `${process.env.NIPA_CLOUD_ENDPOINT}/${process.env.NIPA_CLOUD_BUCKET_NAME}/${s3Key}`;

    const saved = await this.galleryService.create({
      originalName: file.originalname,
      fileUrl,
      s3Key,
      mimeType: file.mimetype,
      fileSize: file.size,
      alt: body.alt,
      sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
    });

    return {
      message: 'อัปโหลดรูปสำเร็จ',
      data: {
        id: saved.id,
        fileUrl: saved.fileUrl,
        alt: saved.alt,
        sortOrder: saved.sortOrder,
      },
    };
  }

  @Get()
  @ApiOperation({
    summary: 'ดึงรูปทั้งหมดสำหรับ SwiperSlide',
    description: 'คืนค่า array ของรูปภาพเรียงตาม sortOrder',
  })
  @ApiOkResponse({
    description: 'รายการรูปภาพ gallery',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fileUrl: { type: 'string' },
          alt: { type: 'string' },
          sortOrder: { type: 'number' },
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findAll() {
    const images = await this.galleryService.findAll();
    return images.map((img) => ({
      id: img.id,
      fileUrl: img.fileUrl,
      alt: img.alt,
      sortOrder: img.sortOrder,
    }));
  }

  @Patch(':id/sort')
  @AdminOnly()
  @ApiOperation({ summary: 'อัปเดตลำดับการแสดงผล' })
  @ApiParam({ name: 'id', description: 'Gallery image ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { sortOrder: { type: 'number', example: 1 } },
      required: ['sortOrder'],
    },
  })
  @HttpCode(HttpStatus.OK)
  async updateSort(
    @Param('id') id: string,
    @Body() body: { sortOrder: number },
  ) {
    const updated = await this.galleryService.updateSort(id, body.sortOrder);
    return {
      message: 'อัปเดตลำดับสำเร็จ',
      data: { id: updated.id, sortOrder: updated.sortOrder },
    };
  }

  @Patch(':id/alt')
  @AdminOnly()
  @ApiOperation({ summary: 'อัปเดต alt text' })
  @ApiParam({ name: 'id', description: 'Gallery image ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { alt: { type: 'string', example: 'สระว่ายน้ำ' } },
      required: ['alt'],
    },
  })
  @HttpCode(HttpStatus.OK)
  async updateAlt(
    @Param('id') id: string,
    @Body() body: { alt: string },
  ) {
    const updated = await this.galleryService.updateAlt(id, body.alt);
    return {
      message: 'อัปเดต alt สำเร็จ',
      data: { id: updated.id, alt: updated.alt },
    };
  }

  @Delete(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'ลบรูปภาพ gallery' })
  @ApiParam({ name: 'id', description: 'Gallery image ID' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    const entity = await this.galleryService.remove(id);

    // Delete from S3
    try {
      await nipaS3.send(
        new DeleteObjectCommand({
          Bucket: process.env.NIPA_CLOUD_BUCKET_NAME,
          Key: entity.s3Key,
        }),
      );
    } catch (error) {
      console.error('Error deleting gallery file from S3:', error);
    }

    return { message: 'ลบรูปภาพสำเร็จ' };
  }
}
