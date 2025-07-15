import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException, ParseFilePipe, FileTypeValidator, MaxFileSizeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ObjectStorageService } from './object-storage.service';

@Controller('object-storage')
export class ObjectStorageController {
  constructor(private readonly objectStorageService: ObjectStorageService) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const key = `uploads/${Date.now()}-${file.originalname}`;
    return await this.objectStorageService.uploadFile(file, key);
  }
}

