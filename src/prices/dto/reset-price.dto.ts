import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class ResetPriceDto {
  @ApiProperty({
    type: Number,
    description: 'ปีที่ต้องการลบราคา เช่น 2025',
    example: 2025,
  })
  @IsNumber()
  year: number;

  @ApiProperty({
    type: String,
    description: 'Room ID',
  })
  @IsString()
  @IsNotEmpty()
  roomId: string;
}
