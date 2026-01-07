import { Module } from "@nestjs/common";
import { FilesService } from "./files.service";
import { FilesController } from "./files.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FileEntity } from "./entities/files.entity";
import { ObjectStorageModule } from "../object-storage/object-storage.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity]),
    ObjectStorageModule,
  ],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
