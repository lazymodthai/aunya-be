import {
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum PromptPayType {
  PHONE = "phone_number",
  NATIONAL_ID = "citizen_id",
  E_WALLET = "e_wallet",
}

export class GenerateQRCodeDto {
  @ApiProperty({
    description: "ID การจอง (Booking ID)",
    example: "room-12345",
  })
  @IsNotEmpty()
  @IsString()
  roomId: string;

  @ApiProperty({
    description: "เบอร์โทรศัพท์ หรือ PromptPay ID (เลขบัตรประชาชน 13 หลัก)",
    example: "0812345678",
  })
  @IsNotEmpty()
  @IsString()
  promptPayCode: string;

  @ApiProperty({
    description: "ประเภท PromptPay",
    enum: PromptPayType,
    example: PromptPayType.PHONE,
  })
  @IsNotEmpty()
  @IsEnum(PromptPayType)
  promptPayType: PromptPayType;

  @ApiProperty({
    description: "ชื่อบัญชี",
    example: "Aunya",
  })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiProperty({
    description: "จำนวนเงิน (บาท) - ส่งเป็น string",
    example: "100",
  })
  @IsNotEmpty()
  @IsNumberString()
  amount: string;
}
