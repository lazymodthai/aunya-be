import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async getHello(): Promise<string> {
    try {
      const isConnected = this.dataSource.isInitialized;
      
      if (!isConnected) {
        return 'Database connection failed!';
      }

      const result = await this.dataSource.query('SELECT NOW() as current_time');
      const currentTime = result[0].current_time;

      return `Database connected successfully. Current time: ${currentTime}`;
    } catch (error) {
      return `Database connection error: ${error.message}`;
    }
  }
}
