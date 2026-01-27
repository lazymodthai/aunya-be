import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [FilesModule],
  providers: [TasksService],
})
export class TasksModule {}
