import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FilesService } from '../files/files.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly filesService: FilesService) {}

  /**
   * Run every 15 minutes to clean up old QR code records
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleQRCodeCleanup() {
    this.logger.log('Starting QR code cleanup task...');
    await this.filesService.cleanupOldQRCodeRecords();
  }
}
