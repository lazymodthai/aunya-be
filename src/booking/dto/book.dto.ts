import { IsDateString, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class BookDto {
  @ApiProperty({
    type: Date,
  })
  @IsDateString()
  checkIn: Date;

  @ApiProperty({
    type: Date,
  })
  @IsDateString()
  checkOut: Date;

  @ApiProperty({
    type: Number,
  })
  @IsNumber()
  guestsNumber: number;

  @ApiProperty({
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  status: string;

}