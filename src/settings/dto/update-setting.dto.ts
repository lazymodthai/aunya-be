import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateSettingDto {
  @ApiProperty({
    type: String,
    description: 'ค่าที่ต้องการอัปเดต',
    example: '10',
  })
  @IsString()
  @IsNotEmpty()
  value: string;
}
