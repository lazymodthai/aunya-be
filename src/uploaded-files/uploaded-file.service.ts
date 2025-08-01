import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadedFileEntity } from './entities/uploaded-file.entity';
import { CreateUploadedFileDto } from './dto/create-uploaded-file.dto';

@Injectable()
export class UploadedFileService {
  constructor(
    @InjectRepository(UploadedFileEntity)
    private uploadedFileRepository: Repository<UploadedFileEntity>,
  ) { }

  async create(createUploadedFileDto: CreateUploadedFileDto): Promise<UploadedFileEntity> {
    const uploadedFile = this.uploadedFileRepository.create(createUploadedFileDto);
    return this.uploadedFileRepository.save(uploadedFile);
  }

  async findOne(id: string): Promise<UploadedFileEntity | null> {
    return this.uploadedFileRepository.findOne({ where: { id } });
  }

  async findOneByS3Key(s3Key: string): Promise<UploadedFileEntity | null> {
    return this.uploadedFileRepository.findOne({ where: { s3Key } });
  }

  async findAll(): Promise<UploadedFileEntity[]> {
    return this.uploadedFileRepository.find();
  }

  async remove(id: string): Promise<void> {
    await this.uploadedFileRepository.delete(id);
  }
}
