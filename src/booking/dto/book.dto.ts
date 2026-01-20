import { IsDateString, IsNumber, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class BookDto {
  @ApiProperty({
    type: Date,
  })
  @IsDateString()
  checkinDate: Date;

  @ApiProperty({
    type: Date,
  })
  @IsDateString()
  checkoutDate: Date;

  @ApiProperty({
    type: Number,
  })
  @IsNumber()
  guestNumber: number;

  @ApiProperty({
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => value === 'null' ? null : value)
  additionGuestNumber: number;

  @ApiProperty({
    type: String,
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
  })
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    type: Number,
  })
  @IsNumber()
  @Transform(({ value }) => value === 'null' ? null : value)
  totalPrice: number;

  @ApiProperty({
    type: String,
  })
  @IsString()
  roomId: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Customer ID (user ID) of the person booking',
  })
  @IsString()
  @IsOptional()
  customerId?: string;
}