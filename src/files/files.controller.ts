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
import jsQR from "jsqr";
import { Jimp } from "jimp";
import axios from "axios";
import { SLIP_VERIFICATION_API } from "config/app-config";
import { CheckSlipService } from "@src/check-slip/check-slip.service";

@Controller("files")
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly checkSlipService: CheckSlipService
  ) {}
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
        roomId: {
          type: "string",
          description: "roomId",
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
      required: ["file", "userTell", "typeslip", "roomId"],
    },
  })
  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: FileUpload
  ) {
    if (!file) {
      throw new Error("No file uploaded");
    }
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${body.roomId}.${fileExt}`;
    const s3Key = `uploads/${Date.now()}-${fileName}`;

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
      roomId: body.roomId,
      userTell: body.userTell,
      typeslip: body.typeslip,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      s3Key: s3Key,
      fileUrl: fileUrl,
    });

    let qrData = null;
    let slipVerificationResult = null;

    try {
      // ดึงรูปภาพจาก URL
      const imageResponse = await axios.get(fileUrl, {
        responseType: "arraybuffer",
      });
      const image = await Jimp.read(Buffer.from(imageResponse.data));
      const { width, height, data } = image.bitmap;
      const qrCode = jsQR(new Uint8ClampedArray(data), width, height);
      console.log("QR Code data:", qrCode);
      if (qrCode) {
        qrData = qrCode.data;
        // Send QR data to slip verification API
        if (SLIP_VERIFICATION_API.url && SLIP_VERIFICATION_API.secretKey) {
          try {
            const response = await axios.post(
              `${SLIP_VERIFICATION_API.url}`,
              {
                payload: {
                  qrCode: qrData,
                },
              },
              {
                headers: {
                  Authorization: `Bearer ${SLIP_VERIFICATION_API.secretKey}`,
                  "Content-Type": "application/json",
                },
              }
            );
            slipVerificationResult = response.data;
          } catch (apiError) {}
        } else {
        }
      } else {
      }
    } catch (error) {}

    if (slipVerificationResult) {
      await this.checkSlipService.SaveSlip({
        referenceId: slipVerificationResult.data.referenceId,
        decode: slipVerificationResult.data.decode,
        transRef: slipVerificationResult.data.transRef,
        dateTime: slipVerificationResult.data.dateTime,
        amount: slipVerificationResult.data.amount,
        ref1: slipVerificationResult.data.ref1,
        ref2: slipVerificationResult.data.ref2,
        ref3: slipVerificationResult.data.ref3,
        receiver: slipVerificationResult.data.receiver || null,
        sender: slipVerificationResult.data.sender || null,
        typeslip: savedFile.typeslip,
      });
    }
    return {
      id: savedFile.id,
      slipVerification: slipVerificationResult,
    };
  }
  @Get("getAll")
  async findAll() {
    const files = await this.filesService.getAllFiles();
    return files.map((file) => ({
      id: file.id,
      originalName: file.originalName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      roomId: file.roomId,
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
      originalName: file.originalName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      roomId: file.roomId,
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
