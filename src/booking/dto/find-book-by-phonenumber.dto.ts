import { IsNotEmpty, IsString } from "class-validator";

export class FindBookingByPhoneNumberDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}