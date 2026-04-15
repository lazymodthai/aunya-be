import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisitorStatsEntity } from './visitor.entity';

@Injectable()
export class VisitorService {
  constructor(
    @InjectRepository(VisitorStatsEntity)
    private readonly repo: Repository<VisitorStatsEntity>,
  ) {}

  async increment(): Promise<number> {
    await this.repo.query(
      `INSERT INTO visitor_stats (id, count)
       VALUES (1, 1)
       ON CONFLICT (id)
       DO UPDATE SET count = visitor_stats.count + 1, "updatedAt" = NOW()`,
    );
    const row = await this.repo.findOne({ where: { id: 1 } });
    return row ? Number(row.count) : 1;
  }

  async getCount(): Promise<number> {
    const row = await this.repo.findOne({ where: { id: 1 } });
    return row ? Number(row.count) : 0;
  }
}
