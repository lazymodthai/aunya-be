import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadedFileService } from './uploaded-file.service';
import { UploadedFile } from './uploaded-file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UploadedFile])],
  providers: [UploadedFileService],
  exports: [UploadedFileService],
})
export class UploadedFileModule { }
