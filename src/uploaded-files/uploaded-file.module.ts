import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadedFileService } from './uploaded-file.service';
import { UploadedFileEntity } from './uploaded-file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UploadedFileEntity])],
  providers: [UploadedFileService],
  exports: [UploadedFileService],
})
export class UploadedFileModule { }
