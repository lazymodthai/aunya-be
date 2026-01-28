import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GalleryEntity } from './gallery.entity';

@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(GalleryEntity)
    private readonly galleryRepository: Repository<GalleryEntity>,
  ) {}

  async create(data: {
    originalName: string;
    fileUrl: string;
    s3Key: string;
    mimeType?: string;
    fileSize?: number;
    alt?: string;
    sortOrder?: number;
  }): Promise<GalleryEntity> {
    const entity = this.galleryRepository.create(data);
    return await this.galleryRepository.save(entity);
  }

  async findAll(): Promise<GalleryEntity[]> {
    return await this.galleryRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<GalleryEntity> {
    const entity = await this.galleryRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`ไม่พบรูปภาพ ID: ${id}`);
    }
    return entity;
  }

  async updateSort(id: string, sortOrder: number): Promise<GalleryEntity> {
    const entity = await this.findOne(id);
    entity.sortOrder = sortOrder;
    return await this.galleryRepository.save(entity);
  }

  async updateAlt(id: string, alt: string): Promise<GalleryEntity> {
    const entity = await this.findOne(id);
    entity.alt = alt;
    return await this.galleryRepository.save(entity);
  }

  async remove(id: string): Promise<GalleryEntity> {
    const entity = await this.findOne(id);
    await this.galleryRepository.delete(id);
    return entity;
  }
}
