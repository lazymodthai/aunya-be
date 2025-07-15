import { Exclude, Expose } from 'class-transformer';

export class UploadedFileResponseDto {
  id: number;
  s3Key: string;
  fileName: string;
  mimetype: string;
  size: number;
  uploaderId: number;
  uploadedAt: Date;
  invoiceNumber?: string;

  @Exclude()
  uploader: any; // Exclude the full uploader object from the response

  constructor(partial: Partial<UploadedFileResponseDto>) {
    Object.assign(this, partial);
  }
}
