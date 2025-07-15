import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException, Get, Param, Delete, Query, Res, HttpStatus, Body, UseGuards, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ObjectStorageService } from './object-storage.service';
import { GetFileDto } from './dto/get-file.dto';
import { DeleteFileDto } from './dto/delete-file.dto';
import { ListFilesDto } from './dto/list-files.dto';
import { Response } from 'express';
import { UploadedFileService } from '../uploaded-files/uploaded-file.service';
import { UploadedFileResponseDto } from '../uploaded-files/dto/uploaded-file-response.dto';
import { plainToClass } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('object-storage')
export class ObjectStorageController {
  constructor(
    private readonly objectStorageService: ObjectStorageService,
    private readonly uploadedFileService: UploadedFileService,
  ) { }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req, // Inject the request object to access user data
  ): Promise<UploadedFileResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const uploaderId = req.user.id; // Get uploaderId from authenticated user
    if (!uploaderId) {
      throw new BadRequestException('Uploader ID not found in token.');
    }
    const invoiceNumber = req.body.invoiceNumber;
    if (!invoiceNumber) {
      throw new BadRequestException('Invoice number not found in request.');
    }

    const key = `${invoiceNumber}.${file.originalname.split('.').pop()}`;
    const s3Response = await this.objectStorageService.uploadFile(file, key, uploaderId, invoiceNumber);
    const uploadedFile = await this.uploadedFileService.findOneByS3Key(key);
    if (!uploadedFile) {
      throw new BadRequestException('Failed to retrieve uploaded file metadata.');
    }
    return plainToClass(UploadedFileResponseDto, uploadedFile);
  }

  @Get('metadata/:id')
  async getUploadedFileMetadata(@Param('id') id: number): Promise<UploadedFileResponseDto> {
    const uploadedFile = await this.uploadedFileService.findOne(id);
    if (!uploadedFile) {
      throw new BadRequestException(`Uploaded file with ID ${id} not found`);
    }
    return plainToClass(UploadedFileResponseDto, uploadedFile);
  }

  @Get('metadata')
  async listUploadedFilesMetadata(): Promise<UploadedFileResponseDto[]> {
    const uploadedFiles = await this.uploadedFileService.findAll();
    return uploadedFiles.map(file => plainToClass(UploadedFileResponseDto, file));
  }

  @Get(':key')
  async getFile(@Param() params: GetFileDto, @Res() res: Response) {
    try {
      console.log('Attempting to retrieve file with key:', params.key);
      const fileStream = await this.objectStorageService.getFile(params.key);
      console.log('File stream:', fileStream);
      // Cast to NodeJS.ReadableStream to use .pipe()
      (fileStream as NodeJS.ReadableStream).pipe(res);
    } catch (error) {
      console.error('Error retrieving file:', error);
      if (error.status === HttpStatus.NOT_FOUND) {
        res.status(HttpStatus.NOT_FOUND).send(error.message);
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error retrieving file');
      }
    }
  }

  @Delete(':key')
  async deleteFile(@Param() params: DeleteFileDto) {
    return this.objectStorageService.deleteFile(params.key);
  }

  @Get()
  async listFiles(@Query() query: ListFilesDto) {
    return this.objectStorageService.listFiles(query.prefix);
  }

  @Delete('metadata/:id')
  async deleteUploadedFileMetadata(@Param('id') id: number) {
    const uploadedFile = await this.uploadedFileService.findOne(id);
    if (!uploadedFile) {
      throw new BadRequestException(`Uploaded file with ID ${id} not found`);
    }
    // Optionally, also delete the file from S3
    await this.objectStorageService.deleteFile(uploadedFile.s3Key);
    await this.uploadedFileService.remove(id);
    return { message: 'Uploaded file metadata and S3 object deleted successfully' };
  }
}

