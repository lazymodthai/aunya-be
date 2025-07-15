import { Inject, Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class ObjectStorageService {
  constructor(@Inject('S3_CLIENT') private readonly s3Client: S3Client) { }

  async uploadFile(file: Express.Multer.File, key: string) {
    const bucketName = process.env.NIPA_CLOUD_BUCKET_NAME;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      const response = await this.s3Client.send(command);
      return response;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw error;
    }
  }
}
