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
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { FilesService } from "./files.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { FileUpload } from "./dto/fileupload";
// import { GenerateQRCodeDto } from "./dto/generate-qrcode.dto";
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
    private readonly checkSlipService: CheckSlipService,
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
        type: {
          type: "string",
          enum: ["generate-qrcode", "upload-slip"],
          description: "ประเภท slip (generate-qrcode หรือ upload-slip)",
        },
      },
      required: ["file", "userTell", "typeslip", "roomId", "type"],
    },
  })
  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: FileUpload,
  ) {
    if (!file) {
      throw new HttpException("ไม่พบไฟล์ที่อัปโหลด", HttpStatus.BAD_REQUEST);
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
        }),
      );
    } catch (error) {
      throw new HttpException(
        "อัปโหลดไฟล์ไปยัง S3 ล้มเหลว",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const fileUrl = `${process.env.NIPA_CLOUD_ENDPOINT}/${process.env.NIPA_CLOUD_BUCKET_NAME}/${s3Key}`;
    const savedFile = await this.filesService.createFileRecord({
      roomId: body.roomId,
      userTell: body.userTell,
      type: body.type,
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
      const imageResponse = await axios.get(fileUrl, {
        responseType: "arraybuffer",
      });
      const image = await Jimp.read(Buffer.from(imageResponse.data));
      const { width, height, data } = image.bitmap;
      const qrCode = jsQR(new Uint8ClampedArray(data), width, height);

      qrData = qrCode.data;
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
            },
          );
          slipVerificationResult = response.data;
        } catch (apiError) {
          console.log(apiError, "apiError");
        }
      } else {
        console.log("ไม่สามารถตรวจสอบสลีปได้ ตรวจสอบ api key");
      }
    } catch (error) {
      console.log(error, "error");
    }

    if (slipVerificationResult && slipVerificationResult.data) {
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
        createdAt: new Date(),
      });
    } else {
    }

    return {
      id: savedFile.id,
      slipVerification: slipVerificationResult,
    };
  }

  // @Post("generate-qrcode")
  // async generateQRCode(@Body() generateQRCodeDto: GenerateQRCodeDto) {
  //   console.log("generateQRCodeDto", generateQRCodeDto);

  //   let qrData = null;
  //   if (
  //     !SLIP_VERIFICATION_API.urlGenerate ||
  //     !SLIP_VERIFICATION_API.secretKey
  //   ) {
  //     console.log("generate", SLIP_VERIFICATION_API.urlGenerate);
  //     console.log("secretKey", SLIP_VERIFICATION_API.secretKey);
  //     throw new HttpException(
  //       "ไม่สามารถสร้าง QR Code ได้ เนื่องจากไม่มีการกำหนดค่า API",
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }

  //   try {
  //     const response = await axios.post(
  //       `${SLIP_VERIFICATION_API.urlGenerate}`,
  //       {
  //         ...generateQRCodeDto,
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${SLIP_VERIFICATION_API.secretKey}`,
  //           "Content-Type": "application/json",
  //         },
  //       },
  //     );
  //     qrData = response.data;
  //     if (qrData && qrData.data?.qrCode) {
  //       let qrImageUrl = null;

  //       // Upload QR code image to S3
  //       try {
  //         // Extract PromptPay QR code string
  //         const qrCodeString = qrData.data.qrCode;
  //         // convert qrcode response to file and save to s3
  //         const QRCode = await import("qrcode");
  //         const qrImageBuffer = await QRCode.toBuffer(qrCodeString, {
  //           type: "png",
  //           width: 400,
  //           margin: 1,
  //         });

  //         const timestamp = Date.now();
  //         const s3Key = `qrcodes/${timestamp}-${generateQRCodeDto.promptPayCode}.png`;

  //         await nipaS3.send(
  //           new PutObjectCommand({
  //             Bucket: process.env.NIPA_CLOUD_BUCKET_NAME,
  //             Key: s3Key,
  //             Body: qrImageBuffer,
  //             ContentType: "image/png",
  //             ACL: "public-read",
  //           }),
  //         );

  //         qrImageUrl = `${process.env.NIPA_CLOUD_ENDPOINT}/${process.env.NIPA_CLOUD_BUCKET_NAME}/${s3Key}`;

  //         await this.filesService.createFileRecord({
  //           type: "qrcode",
  //           roomId: generateQRCodeDto.roomId,
  //           userTell: generateQRCodeDto.promptPayCode,
  //           fileUrl: qrImageUrl,
  //           s3Key: s3Key,
  //           mimeType: "image/png",
  //           fileSize: qrImageBuffer.length,
  //           originalName: `qrcode-${generateQRCodeDto.promptPayCode}.png`,
  //         });
  //       } catch (uploadError) {
  //         console.error("Failed to upload QR code to S3:", uploadError.message);
  //       }
  //     }
  //   } catch (apiError) {
  //     console.error("=== QR Code Generation Error ===");
  //     console.error("Error message:", apiError.message);
  //     console.error("Error response:", apiError.response?.data);
  //     console.error("================================");

  //     throw new HttpException(
  //       "ไม่สามารถสร้าง QR Code ได้ กรุณาลองใหม่อีกครั้ง",
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }
  //   return {
  //     success: true,
  //     qrCode: qrData,
  //     promptPayCode: generateQRCodeDto.promptPayCode,
  //     amount: generateQRCodeDto.amount,
  //   };
  // }
  @Get("getAll")
  async findAll() {
    const files = await this.filesService.getAllFiles();
    return files.map((file) => ({
      id: file.id,
      type: file.type,
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

  @Get("booking/:roomId")
  async getFilesByBooking(@Param("roomId") roomId: string) {
    const files = await this.filesService.getFilesByRoomId(roomId);

    // Separate files by type
    const qrCode = files.find((f) => f.type === "qrcode");
    const slips = files.filter((f) => f.type !== "qrcode");

    return {
      roomId,
      qrCode: qrCode
        ? {
            id: qrCode.id,
            fileUrl: qrCode.fileUrl,
            createdAt: qrCode.createdAt,
          }
        : null,
      slips: slips.map((slip) => ({
        id: slip.id,
        originalName: slip.originalName,
        fileSize: slip.fileSize,
        fileUrl: slip.fileUrl,
        typeslip: slip.typeslip,
        createdAt: slip.createdAt,
      })),
      totalFiles: files.length,
    };
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
        }),
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
