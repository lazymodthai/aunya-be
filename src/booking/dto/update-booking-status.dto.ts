import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { BookingStatus } from "@/constants/booking.enum";

export class UpdateBookingStatusDto {
  @ApiProperty({
    enum: BookingStatus,
    description: "สถานะการจองใหม่",
    example: BookingStatus.CONFIRMED,
  })
  @IsEnum(BookingStatus)
  status: BookingStatus;

  @ApiProperty({
    type: Number,
    required: false,
    description: "จำนวนเงินที่จ่ายเพิ่ม (บาท) — ใช้สำหรับจ่ายส่วนที่เหลือ",
    example: 3000,
  })
  @IsNumber()
  @IsOptional()
  additionalPayment?: number;

  @ApiProperty({
    type: String,
    required: false,
    description: "หมายเหตุจาก Admin",
    example: "ห้องพักพร้อมให้บริการครับ",
  })
  @IsString()
  @IsOptional()
  remark?: string;
}
