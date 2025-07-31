import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class FindBookingDto {
  @ApiProperty({
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}