import { Module } from '@nestjs/common';
import { ObjectStorageController } from './object-storage.controller';
import { ObjectStorageService } from './object-storage.service';
import { S3Client } from '@aws-sdk/client-s3';

@Module({
  controllers: [ObjectStorageController],
  providers: [
    ObjectStorageService,
    {
      provide: 'S3_CLIENT',
      useFactory: (): S3Client => {
        return new S3Client({
          region: 'th-bkk',
          endpoint: process.env.NIPA_CLOUD_ENDPOINT,
          credentials: {
            accessKeyId: process.env.NIPA_CLOUD_ACCESS_KEY_ID ?? "",
            secretAccessKey: process.env.NIPA_CLOUD_SECRET_ACCESS_KEY ?? "",
          },
          forcePathStyle: true, // Important for S3-compatible storage
        });
      },
    },
  ],
  exports: [ObjectStorageService],
})
export class ObjectStorageModule { }
