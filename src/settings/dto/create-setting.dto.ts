import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSettingDto {
  @ApiProperty({
    type: String,
    description: 'Key ของ setting',
    example: 'maxGuests',
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    type: String,
    description: 'ค่าของ setting',
    example: '10',
  })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({
    type: String,
    description: 'คำอธิบาย setting',
    example: 'จำนวนผู้เข้าพักสูงสุด',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
