import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class GeneratePriceDto {
  @ApiProperty({
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  weekdayPrice: number;

  @ApiProperty({
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  weekendPrice: number;

  @ApiProperty({
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  holidayPrice: number;

  @ApiProperty({
    type: String,
  })
  @IsString()
  @IsOptional()
  description: string | null;

  @ApiProperty({
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  roomId: string;
}