import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class FindBookingByPhoneNumberDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}