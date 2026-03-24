import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateBookingRemarkDto {
  @ApiProperty({
    type: String,
    required: false,
    description: "หมายเหตุ",
    example: "test",
  })
  @IsString()
  @IsOptional()
  remark?: string;
}
