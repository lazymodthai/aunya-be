import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FilesService } from "./files.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { FileUpload } from "./dto/fileupload";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";
import { Response } from "express";
import { nipaS3 } from "./nipa";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "ไฟล์ที่ต้องการอัปโหลด",
        },
        userTell: {
          type: "string",
          description: "เบอร์โทรศัพท์ผู้ใช้",
        },
        typeslip: {
          type: "string",
          description: "ประเภท slip",
        },
      },
      required: ["file", "userTell", "typeslip"],
    },
  })
  @Post("upload/:id")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: FileUpload,
    @Param("id") id: string
  ) {
    // Validation
    if (!file) {
      throw new Error("No file uploaded");
    }
    if (!id) {
      throw new Error("No id uploaded");
    }

    // Prepare file info
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${id}.${fileExt}`;
    const s3Key = `uploads/${Date.now()}-${fileName}`;

    // Upload to S3
    try {
      await nipaS3.send(
        new PutObjectCommand({
          Bucket: process.env.NIPA_CLOUD_BUCKET_NAME,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: "public-read",
        })
      );
    } catch (error) {
      throw error;
    }

    // Generate file URL
    const fileUrl = `${process.env.NIPA_CLOUD_ENDPOINT}/${process.env.NIPA_CLOUD_BUCKET_NAME}/${s3Key}`;

    // Save to database
    const savedFile = await this.filesService.createFileRecord({
      bookingId: id,
      userTell: body.userTell,
      typeslip: body.typeslip,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      s3Key: s3Key,
      fileUrl: fileUrl,
    });

    return {
      id: savedFile.id,
    };
  }

  @Get("getAll")
  async findAll() {
    const files = await this.filesService.getAllFiles();
    return files.map((file) => ({
      id: file.id,
      fileName: file.fileName,
      fileSize: file.fileSize,
      fileType: file.fileType,
      bookingId: file.bookingId,
      userTell: file.userTell,
      typeslip: file.typeslip,
      s3Key: file.s3Key,
      fileUrl: file.fileUrl,
      createdAt: file.createdAt,
    }));
  }

  @Get("get/:id")
  async findOne(@Param("id") id: string) {
    const file = await this.filesService.getFileById(id);
    if (!file) {
      return null;
    }
    return {
      id: file.id,
      fileName: file.fileName,
      fileSize: file.fileSize,
      fileType: file.fileType,
      bookingId: file.bookingId,
      userTell: file.userTell,
      typeslip: file.typeslip,
      s3Key: file.s3Key,
      fileUrl: file.fileUrl,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }

  @Get("download/:id")
  async downloadFile(@Param("id") id: string, @Res() res: Response) {
    const file = await this.filesService.getFileById(id);
    if (!file) {
      throw new Error(`File with id "${id}" not found`);
    }
    return res.redirect(file.fileUrl);
  }

  @Delete("delete/:id")
  async deleteOne(@Param("id") id: string) {
    const file = await this.filesService.getFileById(id);

    if (!file) {
      throw new Error(`File with id "${id}" not found`);
    }

    // Delete from S3
    try {
      await nipaS3.send(
        new DeleteObjectCommand({
          Bucket: process.env.NIPA_CLOUD_BUCKET_NAME,
          Key: file.s3Key,
        })
      );
    } catch (error) {
      console.error("Error deleting file from S3:", error);
    }

    // Delete from database
    await this.filesService.deleteFileById(id);

    return {
      message: "File deleted successfully",
    };
  }
}
