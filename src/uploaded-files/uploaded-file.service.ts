import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadedFile } from './uploaded-file.entity';
import { CreateUploadedFileDto } from './dto/create-uploaded-file.dto';

@Injectable()
export class UploadedFileService {
  constructor(
    @InjectRepository(UploadedFile)
    private uploadedFileRepository: Repository<UploadedFile>,
  ) { }

  async create(createUploadedFileDto: CreateUploadedFileDto): Promise<UploadedFile> {
    const uploadedFile = this.uploadedFileRepository.create(createUploadedFileDto);
    return this.uploadedFileRepository.save(uploadedFile);
  }

  async findOne(id: number): Promise<UploadedFile | null> {
    return this.uploadedFileRepository.findOne({ where: { id } });
  }

  async findOneByS3Key(s3Key: string): Promise<UploadedFile | null> {
    return this.uploadedFileRepository.findOne({ where: { s3Key } });
  }

  async findAll(): Promise<UploadedFile[]> {
    return this.uploadedFileRepository.find();
  }

  async remove(id: number): Promise<void> {
    await this.uploadedFileRepository.delete(id);
  }
}
