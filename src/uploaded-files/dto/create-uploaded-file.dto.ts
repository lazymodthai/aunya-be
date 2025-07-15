import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDate } from 'class-validator';

export class CreateUploadedFileDto {
  @IsString()
  @IsNotEmpty()
  s3Key: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  mimetype: string;

  @IsNumber()
  @IsNotEmpty()
  size: number;

  @IsNumber()
  @IsNotEmpty()
  uploaderId: number;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsDate()
  @IsNotEmpty()
  uploadedAt: Date;

}
