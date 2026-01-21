import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { BookingStatus } from "@/constants/booking.enum";

export class UpdateBookingStatusDto {
  @ApiProperty({
    enum: BookingStatus,
    description: "สถานะการจองใหม่",
    example: BookingStatus.CONFIRMED,
  })
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
