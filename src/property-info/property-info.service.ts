import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyInfoEntity } from './property-info.entity';

const SEED_DATA: Partial<PropertyInfoEntity>[] = [
  // ข้อมูลทั่วไป
  { category: 'general', label: '3 ห้องนอน', sortOrder: 0 },
  { category: 'general', label: '3 ห้องน้ำ', sortOrder: 1 },
  { category: 'general', label: 'รองรับ 8 - 10 คน', sortOrder: 2 },
  { category: 'general', label: 'ที่นอนเสริม 2 ชุด', sortOrder: 3 },
  { category: 'general', label: 'ที่จอดรถมากกว่า 4 คัน', sortOrder: 4 },
  // สิ่งอำนวยความสะดวก
  { category: 'facilities', label: 'สระว่ายน้ำระบบเกลือ ลึก 1.2 เมตร', sortOrder: 0 },
  { category: 'facilities', label: 'อ่างอาบน้ำ เครื่องทำน้ำอุ่น', sortOrder: 1 },
  { category: 'facilities', label: 'ห้องโถงกว้าง สูงโปร่งสบาย', sortOrder: 2 },
  { category: 'facilities', label: 'ลำโพง JBL Partybox พร้อมไมค์', sortOrder: 3 },
  { category: 'facilities', label: 'Smart TV', sortOrder: 4 },
  { category: 'facilities', label: 'Free Wifi', sortOrder: 5 },
  { category: 'facilities', label: 'เตียง 2 ชั้นพร้อมสไลด์เดอร์', sortOrder: 6 },
  { category: 'facilities', label: 'ห่วงยางสำหรับเด็ก', sortOrder: 7 },
  { category: 'facilities', label: 'ชั้นดาดฟ้ารับลมชมวิว 360 องศา', sortOrder: 8 },
  { category: 'facilities', label: 'โต๊ะพูลขนาด 7 ฟุต', sortOrder: 9 },
  { category: 'facilities', label: 'เตาปิ้งย่าง', sortOrder: 10 },
  { category: 'facilities', label: 'เครื่องใช้ไฟฟ้าในครัว', sortOrder: 11 },
  { category: 'facilities', label: 'ฟรีน้ำดื่ม 1 แพ็ค', sortOrder: 12 },
  // ข้อกำหนดการเข้าพัก
  { category: 'policies', label: 'ใช้เสียงดังได้ถึงเที่ยงคืน', sortOrder: 0 },
  { category: 'policies', label: 'ห้ามนำสัตว์เลี้ยงเข้าพัก', sortOrder: 1 },
];

@Injectable()
export class PropertyInfoService implements OnModuleInit {
  constructor(
    @InjectRepository(PropertyInfoEntity)
    private readonly repo: Repository<PropertyInfoEntity>,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count === 0) {
      const entities = SEED_DATA.map((d) => this.repo.create(d));
      await this.repo.save(entities);
    }
  }

  async findAll(category?: string): Promise<PropertyInfoEntity[]> {
    const where = category ? { category } : {};
    return this.repo.find({ where, order: { sortOrder: 'ASC', createdAt: 'ASC' } });
  }

  async findOne(id: string): Promise<PropertyInfoEntity> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`ไม่พบรายการ ID: ${id}`);
    return item;
  }

  async create(data: {
    category: string;
    label: string;
    sortOrder?: number;
  }): Promise<PropertyInfoEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async updateLabel(id: string, label: string): Promise<PropertyInfoEntity> {
    const item = await this.findOne(id);
    item.label = label;
    return this.repo.save(item);
  }

  async updateIcon(
    id: string,
    iconUrl: string,
    iconS3Key: string,
  ): Promise<PropertyInfoEntity> {
    const item = await this.findOne(id);
    const oldS3Key = item.iconS3Key;
    item.iconUrl = iconUrl;
    item.iconS3Key = iconS3Key;
    await this.repo.save(item);
    return { ...item, iconS3Key: oldS3Key } as any; // return oldS3Key so controller can delete it
  }

  async remove(id: string): Promise<PropertyInfoEntity> {
    const item = await this.findOne(id);
    await this.repo.delete(id);
    return item;
  }
}
