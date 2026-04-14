import { ApiProperty, PartialType } from "@nestjs/swagger";
import { BookDto } from "./book.dto";
import { BookingStatus } from "@/constants/booking.enum";
import { IsEnum, IsNumber, IsOptional } from "class-validator";

export class UpdateBookingDto extends PartialType(BookDto) {
  @ApiProperty({
    enum: BookingStatus,
    description: "สถานะการจอง",
    required: false,
  })
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @ApiProperty({
    type: Number,
    description: "จำนวนเงินที่จ่ายแล้ว",
    required: false,
  })
  @IsNumber()
  @IsOptional()
  paidAmount?: number;

  @ApiProperty({
    type: Number,
    description: "ส่วนลด",
    required: false,
  })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiProperty({
    type: Number,
    description: "ราคาสุทธิ",
    required: false,
  })
  @IsNumber()
  @IsOptional()
  totalPrice?: number;
}
