import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { UploadedFileService } from '../uploaded-files/uploaded-file.service';
import { CreateUploadedFileDto } from '../uploaded-files/dto/create-uploaded-file.dto';

@Injectable()
export class ObjectStorageService {
  constructor(
    @Inject('S3_CLIENT') private readonly s3Client: S3Client,
    private readonly uploadedFileService: UploadedFileService,
  ) { }

  private get bucketName(): string {
    return process.env.NIPA_CLOUD_BUCKET_NAME ?? "";
  }

  async uploadFile(file: Express.Multer.File, key: string, uploaderId: number, invoiceNumber: string) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      // console.log('Uploading to S3 with key:', key);
      const response = await this.s3Client.send(command);
      // console.log('S3 Upload Response:', response);

      const createUploadedFileDto: CreateUploadedFileDto = {
        s3Key: key,
        fileName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        uploaderId: uploaderId,
        invoiceNumber: invoiceNumber,
        uploadedAt: new Date(),
      };
      await this.uploadedFileService.create(createUploadedFileDto);

      return response;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw error;
    }
  }

  async getFile(key?: string) {
    const bucketName = this.bucketName;
    console.log(`Attempting to get file from S3. Bucket: ${bucketName}, Key: ${key}`);
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key || "",
    });
    console.log('S3 Command:', command)

    try {
      const response = await this.s3Client.send(command);
      console.log('S3 Response:', response);
      if (!response.Body) {
        throw new NotFoundException(`File with key "${key}" not found.`);
      }
      return response.Body;
    } catch (error) {
      console.error('Error getting file from S3:', error); // Log the full error object
      if (error.name === 'NoSuchKey') {
        throw new NotFoundException(`File with key "${key}" not found.`);
      }
      throw error;
    }
  }

  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const response = await this.s3Client.send(command);
      // Optionally, delete the record from the database as well
      // const uploadedFile = await this.uploadedFileService.findOneByS3Key(key);
      // if (uploadedFile) {
      //   await this.uploadedFileService.remove(uploadedFile.id);
      // }
      return response;
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw error;
    }
  }

  async listFiles(prefix?: string) {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    });

    try {
      const response = await this.s3Client.send(command);
      return response.Contents || [];
    } catch (error) {
      console.error('Error listing files from S3:', error);
      throw error;
    }
  }
}
