import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, Repository } from "typeorm";
import { FileEntity } from "./entities/files.entity";
import generatePayload from "promptpay-qr";
import * as QRCode from "qrcode";

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @InjectRepository(FileEntity)
    private readonly filesRepository: Repository<FileEntity>
  ) {}

  async createFileRecord(data: {
    type: string;
    roomId?: string;
    userTell?: string;
    typeslip?: string;
    originalName?: string;
    mimeType?: string;
    fileSize?: number;
    s3Key?: string;
    fileUrl?: string;
  }) {
    const fileEntity = this.filesRepository.create(data);
    return await this.filesRepository.save(fileEntity);
  }

  async getAllFiles() {
    return await this.filesRepository.find();
  }

  async getFileById(id: string) {
    return await this.filesRepository.findOne({ where: { id } });
  }

  /**
   * Get all files related to a specific booking/room
   * @param roomId - Booking/Room ID
   * @returns Array of files (QR codes and slips)
   */
  async getFilesByRoomId(roomId: string) {
    return await this.filesRepository.find({
      where: { roomId },
      order: { createdAt: 'DESC' }
    });
  }

  async deleteFileById(id: string) {
    await this.filesRepository.delete(id);
  }

  /**
   * Clean up QR code records older than 15 minutes
   * This method should be called by a scheduled task
   */
  async cleanupOldQRCodeRecords(): Promise<void> {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      
      const result = await this.filesRepository.delete({
        type: 'qrcode',
        createdAt: LessThan(fifteenMinutesAgo),
      });

      if (result.affected && result.affected > 0) {
        this.logger.log(`Cleaned up ${result.affected} old QR code records`);
      }
    } catch (error) {
      this.logger.error(`Failed to cleanup old QR code records: ${error.message}`);
    }
  }

  /**
   * Generate PromptPay QR Code for payment
   * @param phoneNumber - Phone number or National ID (13 digits)
   * @param amount - Amount in THB
   * @returns Base64 encoded QR code image
   */
  async generatePaymentQRCode(
    phoneNumber: string,
    amount: number
  ): Promise<string> {
    try {
      const payload = generatePayload(phoneNumber, { amount });
      
      const qrCodeDataURL = await QRCode.toDataURL(payload, {
        type: 'image/png',
        width: 400,
        margin: 1,
      });

      return qrCodeDataURL;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }
}
