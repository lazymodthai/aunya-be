import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FileEntity } from "./entities/files.entity";

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly filesRepository: Repository<FileEntity>
  ) {}

  async createFileRecord(data: {
    roomId: string;
    userTell: string;
    typeslip: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    s3Key: string;
    fileUrl: string;
  }) {
    const fileEntity = this.filesRepository.create(data);
    return await this.filesRepository.save(fileEntity);
  }

  async getAllFiles() {
    return await this.filesRepository.find();
  }

  async getFileById(id: string) {
    return await this.filesRepository.findOne({ where: { id } });
  }

  async deleteFileById(id: string) {
    await this.filesRepository.delete(id);
  }
  
  



}
