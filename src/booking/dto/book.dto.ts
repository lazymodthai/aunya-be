import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from "class-validator";
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
    description: 'จำนวนผู้ใหญ่',
  })
  @IsNumber()
  guestNumber: number;

  @ApiProperty({
    type: Number,
    required: false,
    description: 'จำนวนเด็ก',
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  childrenNumber?: number;

  @ApiProperty({
    type: Number,
    required: false,
    description: 'จำนวนเตียงเสริม',
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

  @ApiProperty({
    type: Number,
    required: false,
    description: 'ส่วนลด (บาท)',
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => value === 'null' ? null : value)
  discount?: number;

  @ApiProperty({
    type: Boolean,
    required: false,
    description: 'จ่ายเฉพาะมัดจำ (true = มัดจำ, false = เต็มจำนวน)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isOnlyDeposit?: boolean;

  @ApiProperty({
    type: Number,
    required: false,
    description: 'จำนวนเงินที่จ่ายแล้ว (บาท)',
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => value === 'null' ? null : value)
  paidAmount?: number;

  @ApiProperty({
    type: Number,
    required: false,
    description: 'จำนวนเงินที่ยังค้างจ่าย (บาท)',
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => value === 'null' ? null : value)
  remainingAmount?: number;

  @ApiProperty({
    type: Number,
    required: false,
    description: 'จำนวนผ้าเช็ดตัวเสริม',
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => value === 'null' ? null : value)
  additionTowel?: number;

  @ApiProperty({
    type: String,
    required: false,
    description: 'หมายเหตุ',
  })
  @IsString()
  @IsOptional()
  remark?: string;
}