import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsString } from "class-validator";

export class CalculatePriceDto {
  @ApiProperty({
    type: String,
    required: true,
    description: "Room ID",
    example: "uuid-of-room",
  })
  @IsNotEmpty()
  @IsString()
  roomId: string;

  @ApiProperty({
    type: String,
    required: true,
    description: "Check-in date (YYYY-MM-DD)",
    example: "2026-01-01",
  })
  @IsNotEmpty()
  @IsDateString()
  checkinDate: string;

  @ApiProperty({
    type: String,
    required: true,
    description: "Check-out date (YYYY-MM-DD)",
    example: "2026-01-04",
  })
  @IsNotEmpty()
  @IsDateString()
  checkoutDate: string;
}
