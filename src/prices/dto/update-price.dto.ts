import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class UpdatePriceDto {
  @ApiProperty({
    type: Number,
    description: 'ราคาใหม่',
  })
  @IsNumber()
  @IsPositive()
  price: number;
}
